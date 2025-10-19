// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./TicketNFT.sol";

/**
 * @title TicketFactory
 * @notice Main contract for creating and managing events, ticket types, and primary ticket sales.
 * @dev MVP focuses on native-currency purchases on the deployment network.
 * - Future support for ERC-20 and cross-chain routing can be added without breaking public interfaces.
 * - Uses Checks-Effects-Interactions and ReentrancyGuard for value transfers.
 * - Mints ERC-721 tickets via TicketNFT; marks tickets used via TicketNFT.
 */
contract TicketFactory is Ownable, ReentrancyGuard {
    using Strings for uint256;

    // ========= Data Structures =========

    /**
     * @notice Event definition
     */
    struct EventData {
        uint256 eventId;
        address organizer;
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        string venue;
        string imageIpfsHash;
        uint256 totalSupply; // Cap across all ticket types
        uint256 sold;        // Total sold across all ticket types
        bool active;
        uint96 royaltyBps;   // Optional default royalty (EIP-2981) applied per minted ticket
    }

    /**
     * @notice Ticket type/tier within an event (e.g., VIP, General)
     */
    struct TicketType {
        uint256 eventId;
        string name;
        uint256 price;   // In native currency for MVP
        uint256 supply;  // Max supply for this ticket type
        uint256 sold;    // Number sold for this ticket type
        string imageIpfsHash; // IPFS hash for tier-specific NFT image
    }

    /**
     * @notice Input struct for creating ticket types
     * @dev Used when creating multiple ticket types at once
     */
    struct TicketTypeInput {
        string name;
        uint256 price;
        uint256 supply;
        string imageIpfsHash; // IPFS hash for tier-specific NFT image
    }

    // ========= Storage =========

    /// @notice Mapping eventId => EventData
    mapping(uint256 => EventData) public events;

    /// @notice Mapping eventId => array of ticket types
    mapping(uint256 => TicketType[]) private _ticketTypes;

    /// @notice Mapping organizer => list of eventIds
    mapping(address => uint256[]) private _organizerEvents;

    /// @notice Auto-incrementing event id
    uint256 public eventCounter;

    /// @notice Proceeds held in factory for each event (native currency)
    mapping(uint256 => uint256) public eventProceedsNative;

    /// @notice Ticket NFT contract used for minting and validation
    TicketNFT public ticketNFT;

    // ========= Custom Errors =========
    error InvalidInput();
    error InvalidEvent();
    error NotOrganizer();
    error Unauthorized();
    error EventInactive();
    error EventNotLive();
    error SoldOut();
    error IncorrectPayment();
    error NothingToWithdraw();
    error WithdrawalFailed();
    error InvalidTicketType();

    // ========= Events =========
    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        string name,
        uint256 startTime,
        uint256 endTime,
        uint256 totalSupply,
        uint96 royaltyBps
    );

    event TicketTypeAdded(
        uint256 indexed eventId,
        uint256 indexed ticketTypeId,
        string name,
        uint256 price,
        uint256 supply
    );

    event TicketPurchased(
        uint256 indexed eventId,
        uint256 indexed ticketTypeId,
        uint256 indexed tokenId,
        address buyer,
        uint256 price
    );

    event EventStatusToggled(uint256 indexed eventId, bool active);

    event FundsWithdrawn(uint256 indexed eventId, address indexed organizer, uint256 amount, address to);

    event NFTContractUpdated(address indexed nft);

    // ========= Constructor =========

    /**
     * @param nft Address of the TicketNFT contract
     */
    constructor(address nft) Ownable(msg.sender) {
        if (nft == address(0)) revert InvalidInput();
        ticketNFT = TicketNFT(nft);
        emit NFTContractUpdated(nft);
    }

    // ========= Modifiers =========

    modifier onlyOrganizer(uint256 eventId) {
        if (events[eventId].organizer != msg.sender) revert NotOrganizer();
        _;
    }

    modifier validEvent(uint256 eventId) {
        if (eventId == 0 || eventId > eventCounter) revert InvalidEvent();
        _;
    }

    // ========= Admin =========

    /**
     * @notice Update the NFT contract address
     * @dev Requires owner; use carefully and update the NFT's factory separately via TicketNFT.setFactory
     */
    function setTicketNFT(address nft) external onlyOwner {
        if (nft == address(0)) revert InvalidInput();
        ticketNFT = TicketNFT(nft);
        emit NFTContractUpdated(nft);
    }

    // ========= Event Management =========

    /**
     * @notice Create a new event with optional initial ticket types
     * @param name_ Name of the event
     * @param description_ Description of the event
     * @param startTime_ Start time (unix)
     * @param endTime_ End time (unix)
     * @param venue_ Venue/location
     * @param imageIpfsHash_ IPFS hash for the event image
     * @param totalSupply_ Global cap across all ticket types (must be > 0)
     * @param royaltyBps_ Default royalty (basis points) for NFTs minted for this event
     * @param initialTicketTypes_ Array of ticket types to add during event creation (can be empty)
     * @return eventId The id of the created event
     */
    function createEvent(
        string memory name_,
        string memory description_,
        uint256 startTime_,
        uint256 endTime_,
        string memory venue_,
        string memory imageIpfsHash_,
        uint256 totalSupply_,
        uint96 royaltyBps_,
        TicketTypeInput[] memory initialTicketTypes_
    ) external returns (uint256 eventId) {
        if (
            bytes(name_).length == 0 ||
            bytes(description_).length == 0 ||
            bytes(venue_).length == 0 ||
            bytes(imageIpfsHash_).length == 0 ||
            totalSupply_ == 0 ||
            endTime_ <= startTime_ ||
            startTime_ == 0
        ) {
            revert InvalidInput();
        }
        eventId = ++eventCounter;

        events[eventId] = EventData({
            eventId: eventId,
            organizer: msg.sender,
            name: name_,
            description: description_,
            startTime: startTime_,
            endTime: endTime_,
            venue: venue_,
            imageIpfsHash: imageIpfsHash_,
            totalSupply: totalSupply_,
            sold: 0,
            active: true,
            royaltyBps: royaltyBps_
        });

        _organizerEvents[msg.sender].push(eventId);

        emit EventCreated(eventId, msg.sender, name_, startTime_, endTime_, totalSupply_, royaltyBps_);

        // Add initial ticket types if provided
        for (uint256 i = 0; i < initialTicketTypes_.length; i++) {
            TicketTypeInput memory input = initialTicketTypes_[i];
            if (bytes(input.name).length == 0 || input.price == 0 || input.supply == 0 || bytes(input.imageIpfsHash).length == 0) {
                revert InvalidInput();
            }

            TicketType memory tt = TicketType({
                eventId: eventId,
                name: input.name,
                price: input.price,
                supply: input.supply,
                sold: 0,
                imageIpfsHash: input.imageIpfsHash
            });

            _ticketTypes[eventId].push(tt);
            
            emit TicketTypeAdded(eventId, i, input.name, input.price, input.supply);
        }
    }

    /**
     * @notice Add a ticket type to an existing event
     * @param eventId Event id
     * @param name_ Ticket type name
     * @param price_ Price in native currency
     * @param supply_ Supply cap for this ticket type
     * @param imageIpfsHash_ IPFS hash for tier-specific NFT image
     * @return ticketTypeId Index of the newly created ticket type
     */
    function addTicketType(
        uint256 eventId,
        string memory name_,
        uint256 price_,
        uint256 supply_,
        string memory imageIpfsHash_
    ) external validEvent(eventId) onlyOrganizer(eventId) returns (uint256 ticketTypeId) {
        if (bytes(name_).length == 0 || price_ == 0 || supply_ == 0 || bytes(imageIpfsHash_).length == 0) revert InvalidInput();
        TicketType memory tt = TicketType({
            eventId: eventId,
            name: name_,
            price: price_,
            supply: supply_,
            sold: 0,
            imageIpfsHash: imageIpfsHash_
        });

        _ticketTypes[eventId].push(tt);
        ticketTypeId = _ticketTypes[eventId].length - 1;

        emit TicketTypeAdded(eventId, ticketTypeId, name_, price_, supply_);
    }

    /**
     * @notice Toggle event status (active/inactive)
     * @param eventId Event id
     */
    function toggleEventStatus(uint256 eventId)
        external
        validEvent(eventId)
        onlyOrganizer(eventId)
    {
        EventData storage ev = events[eventId];
        ev.active = !ev.active;
        emit EventStatusToggled(eventId, ev.active);
    }

    // ========= Purchasing =========

    /**
     * @notice Purchase a ticket for an event and ticket type (no metadata URI provided)
     * @dev For metadata, frontend can call setTokenURI on TicketNFT after upload
     */
    function purchaseTicket(uint256 eventId, uint256 ticketTypeId)
        external
        payable
        validEvent(eventId)
        nonReentrant
        returns (uint256 tokenId)
    {
        return _purchase(eventId, ticketTypeId, "");
    }

    /**
     * @notice Purchase multiple tickets for an event and ticket type
     * @param eventId The event id
     * @param ticketTypeId The ticket type id
     * @param quantity The number of tickets to purchase
     * @return tokenIds An array of the newly minted token ids
     */
    function purchaseTickets(uint256 eventId, uint256 ticketTypeId, uint256 quantity)
        external
        payable
        validEvent(eventId)
        nonReentrant
        returns (uint256[] memory tokenIds)
    {
        return _purchaseMultiple(eventId, ticketTypeId, quantity);
    }

    /**
     * @notice Purchase a ticket and set the token URI at mint time
     * @param tokenURI_ IPFS metadata URI (e.g., ipfs://CID)
     */
    function purchaseTicketWithURI(
        uint256 eventId,
        uint256 ticketTypeId,
        string memory tokenURI_
    )
        external
        payable
        validEvent(eventId)
        nonReentrant
        returns (uint256 tokenId)
    {
        if (bytes(tokenURI_).length == 0) revert InvalidInput();
        return _purchase(eventId, ticketTypeId, tokenURI_);
    }

    function _purchase(uint256 eventId, uint256 ticketTypeId, string memory tokenURI_)
        internal
        returns (uint256 tokenId)
    {
        EventData storage ev = events[eventId];
        if (!ev.active) revert EventInactive();
        // Allow pre-sales before the event starts; only restrict purchases after the event ends
        if (block.timestamp > ev.endTime) revert EventNotLive();

        if (ticketTypeId >= _ticketTypes[eventId].length) revert InvalidTicketType();
        TicketType storage tt = _ticketTypes[eventId][ticketTypeId];

        if (tt.sold >= tt.supply) revert SoldOut();
        if (ev.sold >= ev.totalSupply) revert SoldOut();
        if (msg.value != tt.price) revert IncorrectPayment();

        // Effects
        unchecked {
            tt.sold += 1;
            ev.sold += 1;
        }
        eventProceedsNative[eventId] += msg.value;

        // Build TicketMetadata per spec
        TicketNFT.TicketMetadata memory meta = TicketNFT.TicketMetadata({
            eventId: eventId,
            ticketTypeId: ticketTypeId,
            originalOwner: msg.sender,
            purchasePrice: msg.value,
            purchaseChain: _chainString(),
            used: false,
            qrCodeHash: "" // Frontend can compute/store separately; optional update later
        });

        // Interactions: mint NFT to buyer
        address royaltyReceiver = ev.organizer;
        uint96 royaltyBps = ev.royaltyBps;

        tokenId = ticketNFT.mint(
            msg.sender,
            meta,
            tokenURI_,
            royaltyReceiver,
            royaltyBps
        );

        emit TicketPurchased(eventId, ticketTypeId, tokenId, msg.sender, msg.value);
    }

    function _purchaseMultiple(uint256 eventId, uint256 ticketTypeId, uint256 quantity)
        internal
        returns (uint256[] memory tokenIds)
    {
        EventData storage ev = events[eventId];
        if (!ev.active) revert EventInactive();
        if (block.timestamp > ev.endTime) revert EventNotLive();

        if (ticketTypeId >= _ticketTypes[eventId].length) revert InvalidTicketType();
        TicketType storage tt = _ticketTypes[eventId][ticketTypeId];

        if (tt.sold + quantity > tt.supply) revert SoldOut();
        if (ev.sold + quantity > ev.totalSupply) revert SoldOut();
        if (msg.value != tt.price * quantity) revert IncorrectPayment();

        // Effects
        unchecked {
            tt.sold += quantity;
            ev.sold += quantity;
        }
        eventProceedsNative[eventId] += msg.value;

        tokenIds = new uint256[](quantity);
        address royaltyReceiver = ev.organizer;
        uint96 royaltyBps = ev.royaltyBps;

        for (uint256 i = 0; i < quantity; i++) {
            TicketNFT.TicketMetadata memory meta = TicketNFT.TicketMetadata({
                eventId: eventId,
                ticketTypeId: ticketTypeId,
                originalOwner: msg.sender,
                purchasePrice: tt.price, // Price per ticket
                purchaseChain: _chainString(),
                used: false,
                qrCodeHash: ""
            });

            uint256 tokenId = ticketNFT.mint(msg.sender, meta, "", royaltyReceiver, royaltyBps);
            tokenIds[i] = tokenId;

            emit TicketPurchased(eventId, ticketTypeId, tokenId, msg.sender, tt.price);
        }
    }

    // ========= Withdrawals =========

    /**
     * @notice Withdraw native proceeds for an event to a specified address
     * @param eventId Event id
     * @param to Recipient address
     */
    function withdrawFunds(uint256 eventId, address payable to)
        external
        validEvent(eventId)
        onlyOrganizer(eventId)
        nonReentrant
    {
        if (to == address(0)) revert InvalidInput();
        uint256 amount = eventProceedsNative[eventId];
        if (amount == 0) revert NothingToWithdraw();

        eventProceedsNative[eventId] = 0;

        (bool ok, ) = to.call{value: amount}("");
        if (!ok) {
            // Restore state if transfer failed
            eventProceedsNative[eventId] = amount;
            revert WithdrawalFailed();
        }

        emit FundsWithdrawn(eventId, msg.sender, amount, to);
    }

    // ========= Views =========

    /**
     * @notice Get event details
     */
    function getEvent(uint256 eventId) external view validEvent(eventId) returns (EventData memory) {
        return events[eventId];
    }

    /**
     * @notice Get multiple events in a single call
     * @dev Optimized for frontend: fetch all events needed for ticket display at once
     * @param eventIds Array of event IDs to retrieve
     * @return eventsData Array of event data (same order as input)
     * @return validFlags Array indicating which events exist (true) or don't exist (false)
     */
    function getEventsBatch(uint256[] calldata eventIds) 
        external 
        view 
        returns (EventData[] memory eventsData, bool[] memory validFlags) 
    {
        eventsData = new EventData[](eventIds.length);
        validFlags = new bool[](eventIds.length);

        for (uint256 i = 0; i < eventIds.length; i++) {
            uint256 eventId = eventIds[i];
            // Check if event exists (eventId > 0 and <= eventCounter)
            if (eventId > 0 && eventId <= eventCounter) {
                eventsData[i] = events[eventId];
                validFlags[i] = true;
            } else {
                validFlags[i] = false;
            }
        }
    }

    /**
     * @notice Get all ticket types for an event
     */
    function getTicketTypes(uint256 eventId) external view validEvent(eventId) returns (TicketType[] memory) {
        return _ticketTypes[eventId];
    }

    /**
     * @notice Get ticket types for multiple events in a single call
     * @dev Optimized for frontend: fetch all ticket types needed at once
     * @param eventIds Array of event IDs
     * @return ticketTypesArray Array of ticket type arrays (same order as input)
     */
    function getTicketTypesBatch(uint256[] calldata eventIds)
        external
        view
        returns (TicketType[][] memory ticketTypesArray)
    {
        ticketTypesArray = new TicketType[][](eventIds.length);

        for (uint256 i = 0; i < eventIds.length; i++) {
            uint256 eventId = eventIds[i];
            // Only return ticket types for valid events
            if (eventId > 0 && eventId <= eventCounter) {
                ticketTypesArray[i] = _ticketTypes[eventId];
            } else {
                // Return empty array for invalid events
                ticketTypesArray[i] = new TicketType[](0);
            }
        }
    }

    /**
     * @notice Get events created by an organizer
     */
    function getOrganizerEvents(address organizer) external view returns (uint256[] memory) {
        return _organizerEvents[organizer];
    }

    /**
     * @notice Check if an address is the organizer of an event
     * @param eventId The event id to check
     * @param addr The address to check
     * @return bool True if the address is the event organizer
     */
    function isEventOrganizer(uint256 eventId, address addr) 
        external 
        view 
        validEvent(eventId) 
        returns (bool) 
    {
        return events[eventId].organizer == addr;
    }

    /**
     * @notice Mark a ticket as validated (used) by the event organizer
     * @param eventId The event id the ticket belongs to
     * @param tokenId The token id of the ticket to validate
     */
    function validateTicket(uint256 eventId, uint256 tokenId)
        external
        validEvent(eventId)
        onlyOrganizer(eventId)
    {
        // The main check is that only the organizer of *this* event can initiate validation.
        // We also check that the ticket belongs to the event to prevent cross-event validation.
        (uint256 evId,,,,,,) = ticketNFT.ticketDetails(tokenId);
        if (evId != eventId) revert InvalidEvent();
        
        ticketNFT.validateTicket(tokenId);
    }

    /**
     * @notice Set or update the tokenURI (metadata) for a ticket
     * @dev Can be called by ticket owner or event organizer to add/update metadata post-purchase
     * @param tokenId The token id to update
     * @param tokenURI_ New IPFS metadata URI (e.g., ipfs://CID)
     */
    function setTicketURI(uint256 tokenId, string memory tokenURI_) external {
        if (bytes(tokenURI_).length == 0) revert InvalidInput();
        
        // Get ticket owner and event info
        address owner = ticketNFT.ownerOf(tokenId);
        (uint256 eventId,,,,,,) = ticketNFT.ticketDetails(tokenId);
        
        // Only ticket owner or event organizer can set metadata
        if (msg.sender != owner && msg.sender != events[eventId].organizer) {
            revert Unauthorized();
        }
        
        ticketNFT.setTokenURI(tokenId, tokenURI_);
    }

    /**
     * @notice Batch set tokenURIs for multiple tickets (gas-efficient for organizers)
     * @dev Useful for organizers to add metadata to multiple tickets at once
     * @param tokenIds Array of token IDs
     * @param tokenURIs Array of IPFS URIs (must match tokenIds length)
     */
    function setTicketURIBatch(uint256[] calldata tokenIds, string[] calldata tokenURIs) external {
        if (tokenIds.length != tokenURIs.length) revert InvalidInput();
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (bytes(tokenURIs[i]).length == 0) revert InvalidInput();
            
            address owner = ticketNFT.ownerOf(tokenIds[i]);
            (uint256 eventId,,,,,,) = ticketNFT.ticketDetails(tokenIds[i]);
            
            // Only ticket owner or event organizer can set metadata
            if (msg.sender != owner && msg.sender != events[eventId].organizer) {
                revert Unauthorized();
            }
            
            ticketNFT.setTokenURI(tokenIds[i], tokenURIs[i]);
        }
    }

    // ========= Internal Utilities =========

    function _chainString() internal view returns (string memory) {
        // Example: "chain-<chainId>"
        // To align to spec "purchaseChain" string, we encode chainId as decimal
        return string(abi.encodePacked("chain:", block.chainid.toString()));
    }

    // ========= Receive / Fallback =========

    receive() external payable {}
    fallback() external payable {}
}