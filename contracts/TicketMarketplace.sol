// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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

    // ========= Storage =========

    /// @notice Incrementing counter for listing ids
    uint256 public listingCounter;

    /// @notice Listing id => Listing
    mapping(uint256 => Listing) public listings;

    /// @notice tokenId => listingId (0 if not listed)
    mapping(uint256 => uint256) public tokenToListing;

    /// @notice NFT contract
    TicketNFT public immutable ticketNFT;

    // ========= Custom Errors =========
    error InvalidInput();
    error NotSeller();
    error NotActive();
    error AlreadyListed();
    error NotListed();
    error TransferFailed();
    error UsedTicket();

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

        // Compute royalty, if any
        (address royaltyReceiver, uint256 royaltyAmount) = ticketNFT.royaltyInfo(lst.tokenId, lst.price);

        uint256 sellerAmount = lst.price;

        if (royaltyReceiver != address(0) && royaltyAmount > 0 && royaltyAmount <= lst.price) {
            sellerAmount = lst.price - royaltyAmount;

            // Pay royalty
            (bool okR, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            if (!okR) revert TransferFailed();
        }

        // Pay seller
        (bool okS, ) = payable(lst.seller).call{value: sellerAmount}("");
        if (!okS) revert TransferFailed();

        // Transfer NFT from escrow to buyer
        ticketNFT.transferFrom(address(this), msg.sender, lst.tokenId);

        // Close listing
        lst.active = false;
        tokenToListing[lst.tokenId] = 0;

        emit TicketPurchased(listingId, lst.tokenId, lst.seller, msg.sender, lst.price, royaltyReceiver, royaltyAmount);
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

    // ========= Fallbacks =========
    receive() external payable {}
    fallback() external payable {}
}