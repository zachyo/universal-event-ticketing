// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TicketNFT.sol";

/**
 * @title TicketMarketplace
 * @notice Secondary marketplace for TicketChain tickets. Uses custody/escrow model.
 * - Sellers list by transferring NFT into escrow (this contract).
 * - Buyers purchase with native currency (MVP).
 * - Enforces EIP-2981 royalties via TicketNFT. Royalty receiver is paid first.
 * - Prevents listing of used tickets.
 * - Phase 2: Batch operations and offer system for better UX
 */
contract TicketMarketplace is Ownable, ReentrancyGuard {
    /// @notice Listing information for a token
    struct Listing {
        uint256 listingId;
        uint256 tokenId;
        address seller;
        uint256 price;     // native currency
        bool active;
        uint256 createdAt;
    }

    /// @notice Offer information for a token
    struct Offer {
        uint256 offerId;
        uint256 tokenId;
        address offerer;
        uint256 offerAmount;
        uint256 expiresAt;
        bool active;
        uint256 createdAt;
    }

    // ========= Storage =========

    /// @notice Incrementing counter for listing ids
    uint256 public listingCounter;

    /// @notice Incrementing counter for offer ids
    uint256 public offerCounter;

    /// @notice Listing id => Listing
    mapping(uint256 => Listing) public listings;

    /// @notice tokenId => listingId (0 if not listed)
    mapping(uint256 => uint256) public tokenToListing;

    /// @notice Offer id => Offer
    mapping(uint256 => Offer) public offers;

    /// @notice tokenId => array of offer ids
    mapping(uint256 => uint256[]) public tokenOffers;

    /// @notice NFT contract
    TicketNFT public immutable ticketNFT;

    /// @notice Track secondary sales count per event
    /// @dev eventId => number of completed secondary sales
    mapping(uint256 => uint256) public eventSecondarySales;

    /// @notice Track total royalties collected per event
    /// @dev eventId => total royalty amount collected in wei
    mapping(uint256 => uint256) public eventRoyaltiesCollected;

    // ========= Custom Errors =========
    error InvalidInput();
    error NotSeller();
    error NotActive();
    error AlreadyListed();
    error NotListed();
    error TransferFailed();
    error UsedTicket();
    error NotOfferer();
    error OfferExpired();
    error InsufficientOfferAmount();
    error ArrayLengthMismatch();

    // ========= Events =========
    event TicketListed(uint256 indexed listingId, uint256 indexed tokenId, address indexed seller, uint256 price);
    event ListingCanceled(uint256 indexed listingId, uint256 indexed tokenId);
    event PriceUpdated(uint256 indexed listingId, uint256 oldPrice, uint256 newPrice);
    event TicketPurchased(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        address buyer,
        uint256 price,
        address royaltyReceiver,
        uint256 royaltyAmount
    );
    event BatchListingCompleted(uint256[] listingIds, uint256[] tokenIds);
    event BatchDelistingCompleted(uint256[] listingIds);
    event OfferMade(uint256 indexed offerId, uint256 indexed tokenId, address indexed offerer, uint256 amount, uint256 expiresAt);
    event OfferAccepted(uint256 indexed offerId, uint256 indexed tokenId, address seller, address offerer, uint256 amount);
    event OfferCanceled(uint256 indexed offerId, uint256 indexed tokenId);

    constructor(address nft) Ownable(msg.sender) {
        if (nft == address(0)) revert InvalidInput();
        ticketNFT = TicketNFT(nft);
    }

    // ========= Core =========

    /**
     * @notice List a ticket for sale by transferring it into escrow
     * @param tokenId Token id to list
     * @param price Sale price in native currency
     * @return listingId Newly created listing id
     */
    function listTicket(uint256 tokenId, uint256 price) external nonReentrant returns (uint256 listingId) {
        if (price == 0) revert InvalidInput();
        if (tokenToListing[tokenId] != 0) revert AlreadyListed();

        // Ensure ticket is not used
        (,,,,, bool used,) = ticketNFT.ticketDetails(tokenId);
        if (used) revert UsedTicket();

        // Must be owner
        if (ticketNFT.ownerOf(tokenId) != msg.sender) revert NotSeller();

        // Transfer into escrow (requires prior approval from owner)
        ticketNFT.transferFrom(msg.sender, address(this), tokenId);

        listingId = ++listingCounter;

        listings[listingId] = Listing({
            listingId: listingId,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true,
            createdAt: block.timestamp
        });

        tokenToListing[tokenId] = listingId;

        emit TicketListed(listingId, tokenId, msg.sender, price);
    }

    /**
     * @notice Cancel an active listing and return the ticket to seller
     * @param listingId Listing id
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage lst = listings[listingId];
        if (lst.listingId == 0) revert NotListed();
        if (!lst.active) revert NotActive();
        if (lst.seller != msg.sender) revert NotSeller();

        lst.active = false;
        tokenToListing[lst.tokenId] = 0;

        // Return NFT to seller
        ticketNFT.transferFrom(address(this), lst.seller, lst.tokenId);

        emit ListingCanceled(listingId, lst.tokenId);
    }

    /**
     * @notice Update price for an active listing
     * @param listingId Listing id
     * @param newPrice New price in native currency
     */
    function updatePrice(uint256 listingId, uint256 newPrice) external {
        if (newPrice == 0) revert InvalidInput();
        Listing storage lst = listings[listingId];
        if (lst.listingId == 0) revert NotListed();
        if (!lst.active) revert NotActive();
        if (lst.seller != msg.sender) revert NotSeller();

        uint256 old = lst.price;
        lst.price = newPrice;

        emit PriceUpdated(listingId, old, newPrice);
    }

    /**
     * @notice Buy a listed ticket. Pays royalties per EIP-2981 first, then seller, and transfers ticket to buyer.
     * @param listingId Listing id
     */
    function buyTicket(uint256 listingId) external payable nonReentrant {
        Listing storage lst = listings[listingId];
        if (lst.listingId == 0) revert NotListed();
        if (!lst.active) revert NotActive();
        if (msg.value != lst.price) revert InvalidInput();

        // Get the event ID from the ticket
        (uint256 eventId,,,,,,) = ticketNFT.ticketDetails(lst.tokenId);

        // Compute royalty, if any
        (address royaltyReceiver, uint256 royaltyAmount) = ticketNFT.royaltyInfo(lst.tokenId, lst.price);

        uint256 sellerAmount = lst.price;

        if (royaltyReceiver != address(0) && royaltyAmount > 0 && royaltyAmount <= lst.price) {
            sellerAmount = lst.price - royaltyAmount;

            // Pay royalty
            (bool okR, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            if (!okR) revert TransferFailed();

            // Track royalty collected for this event
            eventRoyaltiesCollected[eventId] += royaltyAmount;
        }

        // Pay seller
        (bool okS, ) = payable(lst.seller).call{value: sellerAmount}("");
        if (!okS) revert TransferFailed();

        // Transfer NFT from escrow to buyer
        ticketNFT.transferFrom(address(this), msg.sender, lst.tokenId);

        // Track secondary sale for this event
        eventSecondarySales[eventId] += 1;

        // Close listing
        lst.active = false;
        tokenToListing[lst.tokenId] = 0;

        emit TicketPurchased(listingId, lst.tokenId, lst.seller, msg.sender, lst.price, royaltyReceiver, royaltyAmount);
    }

    // ========= Batch Operations =========

    /**
     * @notice List multiple tickets in a single transaction
     * @param tokenIds Array of token ids to list
     * @param prices Array of prices (must match tokenIds length)
     * @return listingIds Array of newly created listing ids
     */
    function batchListTickets(uint256[] calldata tokenIds, uint256[] calldata prices) 
        external 
        nonReentrant 
        returns (uint256[] memory listingIds) 
    {
        uint256 length = tokenIds.length;
        if (length == 0 || length != prices.length) revert ArrayLengthMismatch();
        
        listingIds = new uint256[](length);
        
        for (uint256 i = 0; i < length; ) {
            uint256 tokenId = tokenIds[i];
            uint256 price = prices[i];
            
            if (price == 0) revert InvalidInput();
            if (tokenToListing[tokenId] != 0) revert AlreadyListed();

            // Ensure ticket is not used
            (,,,,, bool used,) = ticketNFT.ticketDetails(tokenId);
            if (used) revert UsedTicket();

            // Must be owner
            if (ticketNFT.ownerOf(tokenId) != msg.sender) revert NotSeller();

            // Transfer into escrow
            ticketNFT.transferFrom(msg.sender, address(this), tokenId);

            uint256 listingId = ++listingCounter;

            listings[listingId] = Listing({
                listingId: listingId,
                tokenId: tokenId,
                seller: msg.sender,
                price: price,
                active: true,
                createdAt: block.timestamp
            });

            tokenToListing[tokenId] = listingId;
            listingIds[i] = listingId;

            emit TicketListed(listingId, tokenId, msg.sender, price);
            
            unchecked { ++i; }
        }
        
        emit BatchListingCompleted(listingIds, tokenIds);
    }

    /**
     * @notice Cancel multiple listings in a single transaction
     * @param listingIds Array of listing ids to cancel
     */
    function batchCancelListings(uint256[] calldata listingIds) external nonReentrant {
        uint256 length = listingIds.length;
        if (length == 0) revert InvalidInput();
        
        for (uint256 i = 0; i < length; ) {
            uint256 listingId = listingIds[i];
            Listing storage lst = listings[listingId];
            
            if (lst.listingId == 0) revert NotListed();
            if (!lst.active) revert NotActive();
            if (lst.seller != msg.sender) revert NotSeller();

            lst.active = false;
            tokenToListing[lst.tokenId] = 0;

            // Return NFT to seller
            ticketNFT.transferFrom(address(this), lst.seller, lst.tokenId);

            emit ListingCanceled(listingId, lst.tokenId);
            
            unchecked { ++i; }
        }
        
        emit BatchDelistingCompleted(listingIds);
    }

    // ========= Offer System =========

    /**
     * @notice Make an offer on a ticket
     * @param tokenId Token id to make offer on
     * @param expiresAt Unix timestamp when offer expires (0 for no expiration)
     * @return offerId Newly created offer id
     */
    function makeOffer(uint256 tokenId, uint256 expiresAt) 
        external 
        payable 
        nonReentrant 
        returns (uint256 offerId) 
    {
        if (msg.value == 0) revert InvalidInput();
        if (expiresAt != 0 && expiresAt <= block.timestamp) revert OfferExpired();
        
        // Token must exist
        ticketNFT.ownerOf(tokenId); // Reverts if token doesn't exist
        
        // Cannot make offer on used ticket
        (,,,,, bool used,) = ticketNFT.ticketDetails(tokenId);
        if (used) revert UsedTicket();
        
        offerId = ++offerCounter;
        
        offers[offerId] = Offer({
            offerId: offerId,
            tokenId: tokenId,
            offerer: msg.sender,
            offerAmount: msg.value,
            expiresAt: expiresAt,
            active: true,
            createdAt: block.timestamp
        });
        
        tokenOffers[tokenId].push(offerId);
        
        emit OfferMade(offerId, tokenId, msg.sender, msg.value, expiresAt);
    }

    /**
     * @notice Accept an offer and sell the ticket
     * @param offerId Offer id to accept
     */
    function acceptOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        
        if (offer.offerId == 0) revert InvalidInput();
        if (!offer.active) revert NotActive();
        if (offer.expiresAt != 0 && offer.expiresAt <= block.timestamp) revert OfferExpired();
        
        uint256 tokenId = offer.tokenId;
        address owner = ticketNFT.ownerOf(tokenId);
        
        // Must be token owner
        if (owner != msg.sender) revert NotSeller();
        
        // Ensure not used
        (,,,,, bool used,) = ticketNFT.ticketDetails(tokenId);
        if (used) revert UsedTicket();
        
        // If listed, cancel the listing
        uint256 listingId = tokenToListing[tokenId];
        if (listingId != 0) {
            listings[listingId].active = false;
            tokenToListing[tokenId] = 0;
        }
        
        // Get the event ID from the ticket
        (uint256 eventId,,,,,,) = ticketNFT.ticketDetails(tokenId);

        // Calculate royalty
        (address royaltyReceiver, uint256 royaltyAmount) = ticketNFT.royaltyInfo(tokenId, offer.offerAmount);

        uint256 sellerAmount = offer.offerAmount;

        if (royaltyReceiver != address(0) && royaltyAmount > 0 && royaltyAmount <= offer.offerAmount) {
            sellerAmount = offer.offerAmount - royaltyAmount;

            // Pay royalty
            (bool okR, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            if (!okR) revert TransferFailed();

            // Track royalty collected for this event
            eventRoyaltiesCollected[eventId] += royaltyAmount;
        }

        // Pay seller
        (bool okS, ) = payable(msg.sender).call{value: sellerAmount}("");
        if (!okS) revert TransferFailed();

        // Transfer NFT to offerer
        ticketNFT.transferFrom(msg.sender, offer.offerer, tokenId);

        // Track secondary sale for this event
        eventSecondarySales[eventId] += 1;

        // Close offer
        offer.active = false;

        emit OfferAccepted(offerId, tokenId, msg.sender, offer.offerer, offer.offerAmount);
    }

    /**
     * @notice Cancel an offer and refund the offerer
     * @param offerId Offer id to cancel
     */
    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        
        if (offer.offerId == 0) revert InvalidInput();
        if (!offer.active) revert NotActive();
        if (offer.offerer != msg.sender) revert NotOfferer();
        
        offer.active = false;
        
        // Refund offerer
        (bool ok, ) = payable(msg.sender).call{value: offer.offerAmount}("");
        if (!ok) revert TransferFailed();
        
        emit OfferCanceled(offerId, offer.tokenId);
    }

    // ========= Views / Helpers =========

    /**
     * @notice Return list of active listings (full data)
     * @dev O(n) over all listings; intended for off-chain UI usage.
     */
    function getActiveListings() external view returns (Listing[] memory results) {
        uint256 count;
        for (uint256 i = 1; i <= listingCounter; i++) {
            if (listings[i].active) {
                unchecked { ++count; }
            }
        }

        results = new Listing[](count);
        uint256 idx;
        for (uint256 i = 1; i <= listingCounter; i++) {
            if (listings[i].active) {
                results[idx] = listings[i];
                unchecked { ++idx; }
            }
        }
    }

    /**
     * @notice Get active listings filtered by event id (reads TicketNFT.ticketDetails to match eventId).
     * @param eventId Event id to filter by
     */
    function getListingsByEvent(uint256 eventId) external view returns (Listing[] memory results) {
        uint256 count;
        for (uint256 i = 1; i <= listingCounter; i++) {
            Listing storage lst = listings[i];
            if (lst.active) {
                (uint256 evId,,,,,,) = ticketNFT.ticketDetails(lst.tokenId);
                if (evId == eventId) {
                    unchecked { ++count; }
                }
            }
        }

        results = new Listing[](count);
        uint256 idx;
        for (uint256 i = 1; i <= listingCounter; i++) {
            Listing storage lst2 = listings[i];
            if (lst2.active) {
                (uint256 evId2,,,,,,) = ticketNFT.ticketDetails(lst2.tokenId);
                if (evId2 == eventId) {
                    results[idx] = lst2;
                    unchecked { ++idx; }
                }
            }
        }
    }

    /**
     * @notice Get all active offers for a token
     * @param tokenId Token id to query
     * @return activeOffers Array of active offers
     */
    function getActiveOffers(uint256 tokenId) external view returns (Offer[] memory activeOffers) {
        uint256[] memory offerIds = tokenOffers[tokenId];
        uint256 count = 0;
        
        // Count active offers
        for (uint256 i = 0; i < offerIds.length; i++) {
            if (offers[offerIds[i]].active && 
                (offers[offerIds[i]].expiresAt == 0 || offers[offerIds[i]].expiresAt > block.timestamp)) {
                count++;
            }
        }
        
        activeOffers = new Offer[](count);
        uint256 idx = 0;
        
        // Populate array
        for (uint256 i = 0; i < offerIds.length; i++) {
            Offer memory offer = offers[offerIds[i]];
            if (offer.active && 
                (offer.expiresAt == 0 || offer.expiresAt > block.timestamp)) {
                activeOffers[idx++] = offer;
            }
        }
    }

    /**
     * @notice Get all offers made by a specific address
     * @param offerer Address to query
     * @return userOffers Array of user's offers
     */
    function getUserOffers(address offerer) external view returns (Offer[] memory userOffers) {
        uint256 count = 0;
        
        // Count user's offers
        for (uint256 i = 1; i <= offerCounter; i++) {
            if (offers[i].offerer == offerer) {
                count++;
            }
        }
        
        userOffers = new Offer[](count);
        uint256 idx = 0;
        
        // Populate array
        for (uint256 i = 1; i <= offerCounter; i++) {
            if (offers[i].offerer == offerer) {
                userOffers[idx++] = offers[i];
            }
        }
    }

    /**
     * @notice Get offer by id
     * @param offerId Offer id to query
     * @return offer Offer struct
     */
    function getOffer(uint256 offerId) external view returns (Offer memory offer) {
        return offers[offerId];
    }

    /**
     * @notice Get secondary market analytics for an event
     * @param eventId Event id to query
     * @return salesCount Number of completed secondary sales
     * @return royaltiesCollected Total royalties collected in wei
     */
    function getEventSecondaryMarketStats(uint256 eventId)
        external
        view
        returns (uint256 salesCount, uint256 royaltiesCollected)
    {
        return (eventSecondarySales[eventId], eventRoyaltiesCollected[eventId]);
    }

    // ========= Fallbacks =========
    receive() external payable {}
    fallback() external payable {}
}