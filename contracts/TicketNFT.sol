// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

/**
 * @title TicketNFT
 * @notice ERC-721 ticket NFT contract for TicketChain.
 * @dev Implements metadata, transfer restrictions, and optional per-token royalties (EIP-2981).
 * - Minting and validation are restricted to the TicketFactory (settable by owner).
 * - Transfers are blocked if a ticket has been marked as used.
 * - Token URIs point to IPFS metadata.
 */
contract TicketNFT is ERC721, Ownable, ERC2981 {
    /// @notice Ticket metadata as specified in the project readme
    struct TicketMetadata {
        uint256 eventId;
        uint256 ticketTypeId;
        address originalOwner;
        uint256 purchasePrice;
        string purchaseChain;
        bool used;
        string qrCodeHash;
    }

    /// @notice Mapping from tokenId to full ticket details
    mapping(uint256 => TicketMetadata) public ticketDetails;

    /// @dev Mapping of tokenId to IPFS metadata URI (e.g., ipfs://CID)
    mapping(uint256 => string) private _tokenURIs;

    /// @notice Incremental token counter for minted tickets (starts at 0)
    uint256 public tokenCounter;

    /// @notice Address of the TicketFactory authorized to mint and validate
    address public factory;

    // ========= Custom Errors =========
    error Unauthorized();
    error TicketUsed();
    error InvalidAddress();
    error TokenNonexistent();

    // ========= Events =========
    event TicketMinted(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        uint256 indexed ticketTypeId,
        address to,
        uint256 purchasePrice,
        string purchaseChain,
        string tokenURI
    );
    event TicketValidated(uint256 indexed tokenId, uint256 timestamp);
    event FactoryUpdated(address indexed factory);
    event TokenURISet(uint256 indexed tokenId, string tokenURI);

    /**
     * @notice Deploy the TicketNFT contract
     * @param name_ ERC-721 collection name
     * @param symbol_ ERC-721 symbol
     * @param initialFactory Address of the initial factory (can be updated by owner)
     * @param defaultRoyaltyReceiver Default royalty receiver (optional, can be address(0))
     * @param defaultRoyaltyBps Default royalty in basis points (0-10000) applied to all tokens unless overridden
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address initialFactory,
        address defaultRoyaltyReceiver,
        uint96 defaultRoyaltyBps
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        if (initialFactory == address(0)) revert InvalidAddress();
        factory = initialFactory;
        if (defaultRoyaltyReceiver != address(0) && defaultRoyaltyBps > 0) {
            _setDefaultRoyalty(defaultRoyaltyReceiver, defaultRoyaltyBps);
        }
        emit FactoryUpdated(initialFactory);
    }

    // ========= Modifiers =========

    modifier onlyFactory() {
        if (msg.sender != factory) revert Unauthorized();
        _;
    }

    // ========= Admin =========

    /**
     * @notice Update the factory address
     * @dev Callable by contract owner only
     * @param newFactory New factory address
     */
    function setFactory(address newFactory) external onlyOwner {
        if (newFactory == address(0)) revert InvalidAddress();
        factory = newFactory;
        emit FactoryUpdated(newFactory);
    }

    // ========= Core Functions =========

    /**
     * @notice Mint a new ticket NFT to the given address
     * @dev Callable only by factory. Also sets per-token royalty if provided.
     * @param to Recipient address
     * @param meta Full TicketMetadata per readme spec
     * @param tokenURI_ IPFS metadata URI (e.g., ipfs://CID)
     * @param royaltyReceiver Optional royalty receiver (event organizer), use address(0) to skip
     * @param royaltyBps Optional per-token royalty in basis points (0-10000)
     * @return tokenId Newly minted token id
     */
    function mint(
        address to,
        TicketMetadata memory meta,
        string memory tokenURI_,
        address royaltyReceiver,
        uint96 royaltyBps
    ) external onlyFactory returns (uint256 tokenId) {
        if (to == address(0)) revert InvalidAddress();

        tokenId = ++tokenCounter;

        // Universal Execution Accounts are deployed as contracts on Push Chain but
        // they don't currently implement IERC721Receiver. When a user purchases
        // from an external chain (e.g. Ethereum), the factory mints directly to
        // their UEA which would fail the `_safeMint` receiver check. To support
        // these multi-chain flows we allow minting to contract recipients by
        // falling back to the plain `_mint` for contract addresses while keeping
        // the safety check for EOAs.
        if (to.code.length > 0) {
            _mint(to, tokenId);
        } else {
            _safeMint(to, tokenId);
        }
        ticketDetails[tokenId] = meta;
        _tokenURIs[tokenId] = tokenURI_;

        if (royaltyReceiver != address(0) && royaltyBps > 0) {
            _setTokenRoyalty(tokenId, royaltyReceiver, royaltyBps);
        }

        emit TicketMinted(
            tokenId,
            meta.eventId,
            meta.ticketTypeId,
            to,
            meta.purchasePrice,
            meta.purchaseChain,
            tokenURI_
        );
    }

    /**
     * @notice Mark a ticket as validated (used)
     * @dev Callable only by factory. Prevents further transfers of the ticket.
     * @param tokenId Ticket token id
     */
    function validateTicket(uint256 tokenId) external onlyFactory {
        if (_ownerOf(tokenId) == address(0)) revert TokenNonexistent();

        TicketMetadata storage meta = ticketDetails[tokenId];
        if (meta.used) revert TicketUsed();

        meta.used = true;
        emit TicketValidated(tokenId, block.timestamp);
    }

    /**
     * @notice Set/update the tokenURI for a token
     * @dev Callable only by factory to support metadata updates (e.g., post-purchase details)
     * @param tokenId Token id
     * @param newURI New IPFS metadata URI
     */
    function setTokenURI(uint256 tokenId, string memory newURI) external onlyFactory {
        if (_ownerOf(tokenId) == address(0)) revert TokenNonexistent();
        _tokenURIs[tokenId] = newURI;
        emit TokenURISet(tokenId, newURI);
    }

    /**
     * @notice Get all ticket token ids owned by a given address
     * @dev O(n) over total supply. Intended for off-chain calls/UI. For large sets, prefer The Graph.
     * @param owner Address to query
     * @return tokenIds Array of token ids
     */
    function getUserTickets(address owner) external view returns (uint256[] memory tokenIds) {
        uint256 count;
        for (uint256 i = 1; i <= tokenCounter; i++) {
            if (_ownerOf(i) == owner) {
                unchecked { ++count; }
            }
        }

        tokenIds = new uint256[](count);
        uint256 idx;
        for (uint256 i = 1; i <= tokenCounter; i++) {
            if (_ownerOf(i) == owner) {
                tokenIds[idx] = i;
                unchecked { ++idx; }
            }
        }
    }

    // ========= Views =========

    /**
     * @inheritdoc ERC721
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenNonexistent();
        return _tokenURIs[tokenId];
    }

    /**
     * @inheritdoc ERC721
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ========= Internal =========

    /**
     * @dev Prevent transfers of used tickets.
     * In OZ v5, ERC721 uses the `_update` hook for mint/transfer/burn.
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address from)
    {
        // Block transfers (not mints) if the ticket is marked used
        if (_ownerOf(tokenId) != address(0)) {
            TicketMetadata storage meta = ticketDetails[tokenId];
            if (meta.used) {
                revert TicketUsed();
            }
        }

        from = super._update(to, tokenId, auth);
        return from;
    }
}