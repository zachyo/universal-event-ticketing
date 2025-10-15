================================================
FILE: contracts/OmniPayBridge.sol
================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title IOmniPayNotifier
 * @notice Interface for payment notification callbacks
 */
interface IOmniPayNotifier {
    function notifyPaymentSuccess(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef
    ) external;

    function notifyPaymentFailure(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef,
        string calldata reason
    ) external;
}

/**
 * @title IPushCommInterface
 * @notice Interface for Push Protocol notifications
 */
interface IPushCommInterface {
    function sendNotification(
        address _channel,
        address _recipient,
        bytes calldata _identity
    ) external;
}

/**
 * @title OmniPayBridge
 * @notice Cross-chain payment bridge supporting multiple chains and tokens
 * @dev Implements secure cross-chain payments with relayer-based message passing
 * @custom:security-contact security@omnipay.example
 */
contract OmniPayBridge is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @notice Status enumeration for cross-chain payments
    enum PaymentStatus {
        Initiated,
        Completed,
        Refunded,
        Cancelled
    }

    /// @notice Structure representing a cross-chain payment
    struct CrossChainPayment {
        address payer;              // Address that initiated the payment
        address payee;              // Intended recipient on target chain
        address token;              // Token address (address(0) for native ETH)
        uint256 amount;             // Payment amount
        uint256 sourceChainId;      // Chain ID where payment originated
        uint256 targetChainId;      // Chain ID where payment will be completed
        string paymentRef;          // Reference string for tracking
        uint256 timestamp;          // When payment was initiated
        PaymentStatus status;       // Current payment status
    }

    /// @notice Emitted when a cross-chain payment is initiated
    event CrossChainPaymentInitiated(
        uint256 indexed paymentId,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 amount,
        uint256 sourceChainId,
        uint256 targetChainId,
        string paymentRef
    );

    /// @notice Emitted when a cross-chain payment is completed
    event CrossChainPaymentCompleted(
        uint256 indexed paymentId,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 amount,
        uint256 sourceChainId,
        uint256 targetChainId,
        string paymentRef
    );

    /// @notice Emitted when a cross-chain payment is refunded
    event CrossChainPaymentRefunded(
        uint256 indexed paymentId,
        address indexed payer,
        address token,
        uint256 amount,
        string reason
    );

    /// @notice Emitted when a cross-chain payment fails
    event CrossChainPaymentFailed(
        uint256 indexed paymentId,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 amount,
        uint256 sourceChainId,
        uint256 targetChainId,
        string paymentRef,
        string reason
    );

    /// @notice Emitted when a payment is cancelled
    event CrossChainPaymentCancelled(
        uint256 indexed paymentId,
        address indexed payer,
        string reason
    );

    /// @notice Emitted when a relayer is added
    event RelayerAdded(address indexed relayer);

    /// @notice Emitted when a relayer is removed
    event RelayerRemoved(address indexed relayer);

    /// @notice Emitted when a chain support status changes
    event ChainSupportUpdated(uint256 indexed chainId, bool supported);

    /// @notice Emitted when bridge fee is updated
    event BridgeFeeUpdated(uint256 oldFee, uint256 newFee);

    /// @notice Emitted when notifier address is updated
    event NotifierUpdated(address indexed oldNotifier, address indexed newNotifier);

    /// @notice Emitted when Push Protocol configuration is updated
    event PushConfigUpdated(address indexed pushComm, address indexed channel);

    /// @notice Array storing all cross-chain payments
    CrossChainPayment[] public payments;

    /// @notice Mapping of authorized relayer addresses
    mapping(address => bool) public authorizedRelayers;

    /// @notice Mapping of supported chain IDs
    mapping(uint256 => bool) public supportedChains;

    /// @notice Mapping to track completed payment IDs from source chains
    mapping(bytes32 => bool) public processedPayments;

    /// @notice Address of the notification contract
    address public notifier;

    /// @notice Address of Push Protocol communicator
    address public pushComm;

    /// @notice Address of Push Protocol channel
    address public channel;

    /// @notice Timeout period for pending payments
    uint256 public constant PAYMENT_TIMEOUT = 24 hours;

    /// @notice Maximum length for payment reference strings
    uint256 public constant MAX_PAYMENT_REF_LENGTH = 256;

    /// @notice Bridge fee in native token
    uint256 public bridgeFee;

    /// @notice Minimum bridge fee (0.0001 ETH)
    uint256 public constant MIN_BRIDGE_FEE = 0.0001 ether;

    /// @notice Maximum bridge fee (1 ETH)
    uint256 public constant MAX_BRIDGE_FEE = 1 ether;

    /**
     * @notice Restricts function access to authorized relayers only
     */
    modifier onlyRelayer() {
        require(authorizedRelayers[msg.sender], "OmniPayBridge: Not authorized relayer");
        _;
    }

    /**
     * @notice Contract constructor
     * @param _notifier Notifier contract address
     * @param _pushComm Push Protocol communicator address
     * @param _channel Push Protocol channel address
     */
    constructor(
        address _notifier,
        address _pushComm,
        address _channel
    ) Ownable(msg.sender) {
        notifier = _notifier;
        pushComm = _pushComm;
        channel = _channel;
        bridgeFee = 0.001 ether;

        // Initialize supported chains
        _addSupportedChain(1);      // Ethereum Mainnet
        _addSupportedChain(8453);   // Base
        _addSupportedChain(137);    // Polygon
        _addSupportedChain(42161);  // Arbitrum One
        _addSupportedChain(10);     // Optimism
    }

    /**
     * @notice Updates the notifier contract address
     * @param _notifier New notifier address
     * @dev Only callable by contract owner
     */
    function setNotifier(address _notifier) external onlyOwner {
        address oldNotifier = notifier;
        notifier = _notifier;
        emit NotifierUpdated(oldNotifier, _notifier);
    }

    /**
     * @notice Updates Push Protocol configuration
     * @param _pushComm New Push communicator address
     * @param _channel New Push channel address
     * @dev Only callable by contract owner
     */
    function setPushConfig(address _pushComm, address _channel) external onlyOwner {
        pushComm = _pushComm;
        channel = _channel;
        emit PushConfigUpdated(_pushComm, _channel);
    }

    /**
     * @notice Updates the bridge fee
     * @param _fee New bridge fee amount
     * @dev Only callable by contract owner. Fee must be within min/max bounds
     */
    function setBridgeFee(uint256 _fee) external onlyOwner {
        require(_fee >= MIN_BRIDGE_FEE, "OmniPayBridge: Fee below minimum");
        require(_fee <= MAX_BRIDGE_FEE, "OmniPayBridge: Fee above maximum");
        
        uint256 oldFee = bridgeFee;
        bridgeFee = _fee;
        emit BridgeFeeUpdated(oldFee, _fee);
    }

    /**
     * @notice Adds an authorized relayer
     * @param _relayer Address to authorize as relayer
     * @dev Only callable by contract owner
     */
    function addRelayer(address _relayer) external onlyOwner {
        require(_relayer != address(0), "OmniPayBridge: Invalid relayer address");
        require(!authorizedRelayers[_relayer], "OmniPayBridge: Relayer already authorized");
        
        authorizedRelayers[_relayer] = true;
        emit RelayerAdded(_relayer);
    }

    /**
     * @notice Removes an authorized relayer
     * @param _relayer Address to remove from relayers
     * @dev Only callable by contract owner
     */
    function removeRelayer(address _relayer) external onlyOwner {
        require(authorizedRelayers[_relayer], "OmniPayBridge: Relayer not authorized");
        
        authorizedRelayers[_relayer] = false;
        emit RelayerRemoved(_relayer);
    }

    /**
     * @notice Adds support for a new chain
     * @param _chainId Chain ID to support
     * @dev Only callable by contract owner
     */
    function addSupportedChain(uint256 _chainId) external onlyOwner {
        require(!supportedChains[_chainId], "OmniPayBridge: Chain already supported");
        _addSupportedChain(_chainId);
    }

    /**
     * @notice Removes support for a chain
     * @param _chainId Chain ID to remove
     * @dev Only callable by contract owner
     */
    function removeSupportedChain(uint256 _chainId) external onlyOwner {
        require(supportedChains[_chainId], "OmniPayBridge: Chain not supported");
        require(_chainId != block.chainid, "OmniPayBridge: Cannot remove current chain");
        
        supportedChains[_chainId] = false;
        emit ChainSupportUpdated(_chainId, false);
    }

    /**
     * @notice Initiates a cross-chain payment
     * @param payee Recipient address on target chain
     * @param token Token contract address (address(0) for native ETH)
     * @param amount Amount to bridge
     * @param targetChainId Target chain ID
     * @param paymentRef Payment reference string
     * @return paymentId The ID of the created payment
     * @dev Locks tokens on source chain and emits event for relayers
     */
    function initiateCrossChainPayment(
        address payee,
        address token,
        uint256 amount,
        uint256 targetChainId,
        string calldata paymentRef
    ) external payable nonReentrant whenNotPaused returns (uint256 paymentId) {
        require(payee != address(0), "OmniPayBridge: Invalid payee address");
        require(amount > 0, "OmniPayBridge: Amount must be greater than zero");
        require(supportedChains[targetChainId], "OmniPayBridge: Unsupported target chain");
        require(targetChainId != block.chainid, "OmniPayBridge: Cannot bridge to same chain");
        require(bytes(paymentRef).length <= MAX_PAYMENT_REF_LENGTH, "OmniPayBridge: Payment ref too long");
        require(msg.value >= bridgeFee, "OmniPayBridge: Insufficient bridge fee");

        // Handle token transfers
        if (token == address(0)) {
            // Native ETH payment
            uint256 totalRequired = amount + bridgeFee;
            require(msg.value >= totalRequired, "OmniPayBridge: Insufficient ETH sent");
            
            // Refund excess
            if (msg.value > totalRequired) {
                (bool success, ) = msg.sender.call{value: msg.value - totalRequired}("");
                require(success, "OmniPayBridge: Excess refund failed");
            }
        } else {
            // ERC20 payment
            require(token.code.length > 0, "OmniPayBridge: Invalid token contract");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        // Create payment record
        paymentId = payments.length;
        payments.push(
            CrossChainPayment({
                payer: msg.sender,
                payee: payee,
                token: token,
                amount: amount,
                sourceChainId: block.chainid,
                targetChainId: targetChainId,
                paymentRef: paymentRef,
                timestamp: block.timestamp,
                status: PaymentStatus.Initiated
            })
        );

        emit CrossChainPaymentInitiated(
            paymentId,
            msg.sender,
            payee,
            token,
            amount,
            block.chainid,
            targetChainId,
            paymentRef
        );

        // Send Push notification (best effort)
        _sendPushNotification(
            msg.sender,
            "Cross-chain payment initiated",
            string(abi.encodePacked(
                "Payment initiated to ",
                _addressToString(payee),
                " on chain ",
                _uint2str(targetChainId)
            ))
        );
    }

    /**
     * @notice Completes a cross-chain payment on the target chain
     * @param paymentId Payment ID from source chain
     * @param payer Original payer address
     * @param payee Recipient address
     * @param token Token contract address
     * @param amount Amount to release
     * @param sourceChainId Source chain ID
     * @param paymentRef Payment reference
     * @dev Only callable by authorized relayers. Releases locked tokens to payee
     */
    function completeCrossChainPayment(
        uint256 paymentId,
        address payer,
        address payee,
        address token,
        uint256 amount,
        uint256 sourceChainId,
        string calldata paymentRef
    ) external onlyRelayer nonReentrant whenNotPaused {
        require(payee != address(0), "OmniPayBridge: Invalid payee address");
        require(amount > 0, "OmniPayBridge: Invalid amount");
        require(supportedChains[sourceChainId], "OmniPayBridge: Unsupported source chain");
        require(sourceChainId != block.chainid, "OmniPayBridge: Invalid source chain");

        // Generate unique payment hash to prevent double-processing
        bytes32 paymentHash = keccak256(
            abi.encodePacked(paymentId, payer, payee, token, amount, sourceChainId, paymentRef)
        );
        require(!processedPayments[paymentHash], "OmniPayBridge: Payment already processed");
        
        processedPayments[paymentHash] = true;

        // Release tokens to payee
        if (token == address(0)) {
            // Release native ETH
            require(address(this).balance >= amount, "OmniPayBridge: Insufficient ETH balance");
            (bool success, ) = payee.call{value: amount}("");
            require(success, "OmniPayBridge: ETH transfer failed");
        } else {
            // Release ERC20 tokens
            IERC20(token).safeTransfer(payee, amount);
        }

        // Create local payment record for completion tracking
        uint256 localPaymentId = payments.length;
        payments.push(
            CrossChainPayment({
                payer: payer,
                payee: payee,
                token: token,
                amount: amount,
                sourceChainId: sourceChainId,
                targetChainId: block.chainid,
                paymentRef: paymentRef,
                timestamp: block.timestamp,
                status: PaymentStatus.Completed
            })
        );

        emit CrossChainPaymentCompleted(
            paymentId,
            payer,
            payee,
            token,
            amount,
            sourceChainId,
            block.chainid,
            paymentRef
        );

        // Notify success
        _notifyPaymentSuccess(payer, payee, token, amount, paymentRef);

        // Send Push notification
        _sendPushNotification(
            payee,
            "Cross-chain payment received",
            string(abi.encodePacked(
                "Received ",
                _uint2str(amount),
                " tokens from ",
                _addressToString(payer)
            ))
        );
    }

    /**
     * @notice Refunds a timed-out or failed payment
     * @param paymentId Payment ID to refund
     * @dev Callable by payer after timeout, or by relayers/owner anytime
     */
    function refundPayment(uint256 paymentId) external nonReentrant {
        require(paymentId < payments.length, "OmniPayBridge: Invalid payment ID");
        CrossChainPayment storage payment = payments[paymentId];

        require(payment.status == PaymentStatus.Initiated, "OmniPayBridge: Payment not refundable");
        
        // Authorization checks
        bool isAuthorized = msg.sender == payment.payer ||
                           authorizedRelayers[msg.sender] ||
                           msg.sender == owner();
        bool isTimedOut = block.timestamp >= payment.timestamp + PAYMENT_TIMEOUT;
        
        require(
            isAuthorized || isTimedOut,
            "OmniPayBridge: Not authorized to refund"
        );

        payment.status = PaymentStatus.Refunded;

        // Process refund
        if (payment.token == address(0)) {
            // Refund native ETH
            (bool success, ) = payment.payer.call{value: payment.amount}("");
            require(success, "OmniPayBridge: ETH refund failed");
        } else {
            // Refund ERC20 tokens
            IERC20(payment.token).safeTransfer(payment.payer, payment.amount);
        }

        string memory reason = isTimedOut ? "Payment timed out" : "Payment refunded by authorized party";

        emit CrossChainPaymentRefunded(
            paymentId,
            payment.payer,
            payment.token,
            payment.amount,
            reason
        );

        // Notify failure
        _notifyPaymentFailure(
            payment.payer,
            payment.payee,
            payment.token,
            payment.amount,
            payment.paymentRef,
            reason
        );
    }

    /**
     * @notice Retrieves payment details
     * @param paymentId Payment ID
     * @return Payment struct containing all payment information
     */
    function getPayment(uint256 paymentId) external view returns (CrossChainPayment memory) {
        require(paymentId < payments.length, "OmniPayBridge: Invalid payment ID");
        return payments[paymentId];
    }

    /**
     * @notice Returns total number of payments
     * @return Total payment count
     */
    function paymentCount() external view returns (uint256) {
        return payments.length;
    }

    /**
     * @notice Retrieves all payment IDs for a specific payer
     * @param payer Payer address to query
     * @return Array of payment IDs
     */
    function getPayerPayments(address payer) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count matching payments
        for (uint256 i = 0; i < payments.length; i++) {
            if (payments[i].payer == payer) {
                count++;
            }
        }

        // Populate result array
        uint256[] memory payerPayments = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < payments.length; i++) {
            if (payments[i].payer == payer) {
                payerPayments[index] = i;
                index++;
            }
        }

        return payerPayments;
    }

    /**
     * @notice Retrieves payments within a range
     * @param startIndex Starting index (inclusive)
     * @param count Number of payments to retrieve
     * @return Array of payment structs
     */
    function getPayments(uint256 startIndex, uint256 count)
        external
        view
        returns (CrossChainPayment[] memory)
    {
        require(startIndex < payments.length, "OmniPayBridge: Start index out of bounds");
        
        uint256 endIndex = startIndex + count;
        if (endIndex > payments.length) {
            endIndex = payments.length;
        }
        
        uint256 resultCount = endIndex - startIndex;
        CrossChainPayment[] memory result = new CrossChainPayment[](resultCount);
        
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = payments[startIndex + i];
        }
        
        return result;
    }

    /**
     * @notice Emergency withdrawal function for owner
     * @param token Token to withdraw (address(0) for native ETH)
     * @param amount Amount to withdraw
     * @dev Only callable by contract owner. Use with extreme caution
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            require(address(this).balance >= amount, "OmniPayBridge: Insufficient ETH balance");
            (bool success, ) = owner().call{value: amount}("");
            require(success, "OmniPayBridge: ETH withdrawal failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    /**
     * @notice Pauses all payment operations
     * @dev Only callable by contract owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Resumes all payment operations
     * @dev Only callable by contract owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Internal function to add chain support
     * @param _chainId Chain ID to add
     */
    function _addSupportedChain(uint256 _chainId) private {
        supportedChains[_chainId] = true;
        emit ChainSupportUpdated(_chainId, true);
    }

    /**
     * @notice Internal function to send success notification
     * @param payer Payer address
     * @param payee Payee address
     * @param token Token address
     * @param amount Payment amount
     * @param paymentRef Payment reference
     */
    function _notifyPaymentSuccess(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef
    ) private {
        if (notifier != address(0)) {
            try IOmniPayNotifier(notifier).notifyPaymentSuccess(
                payer,
                payee,
                token,
                amount,
                paymentRef
            ) {} catch {
                // Best-effort notification
            }
        }
    }

    /**
     * @notice Internal function to send failure notification
     * @param payer Payer address
     * @param payee Payee address
     * @param token Token address
     * @param amount Payment amount
     * @param paymentRef Payment reference
     * @param reason Failure reason
     */
    function _notifyPaymentFailure(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string memory paymentRef,
        string memory reason
    ) private {
        if (notifier != address(0)) {
            try IOmniPayNotifier(notifier).notifyPaymentFailure(
                payer,
                payee,
                token,
                amount,
                paymentRef,
                reason
            ) {} catch {
                // Best-effort notification
            }
        }
    }

    /**
     * @notice Internal function to send Push Protocol notifications
     * @param recipient Notification recipient
     * @param title Notification title
     * @param body Notification body
     */
    function _sendPushNotification(
        address recipient,
        string memory title,
        string memory body
    ) private {
        if (pushComm != address(0) && channel != address(0)) {
            try IPushCommInterface(pushComm).sendNotification(
                channel,
                recipient,
                abi.encodePacked(
                    "0",  // notification type
                    "+",  // delimiter
                    title,
                    "+",  // delimiter
                    body
                )
            ) {} catch {
                // Best-effort notification
            }
        }
    }

    /**
     * @notice Converts uint256 to string
     * @param _i Number to convert
     * @return String representation
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = uint8(48 + (_i % 10));
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        
        return string(bstr);
    }

    /**
     * @notice Converts address to string (shortened format)
     * @param _addr Address to convert
     * @return String representation (0x...first4...last4)
     */
    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory data = abi.encodePacked(_addr);
        bytes memory str = new bytes(10);
        
        str[0] = "0";
        str[1] = "x";
        
        // First 4 chars after 0x
        for (uint256 i = 0; i < 4; i++) {
            str[2 + i] = alphabet[uint8(data[i] >> 4)];
        }
        
        str[6] = ".";
        str[7] = ".";
        str[8] = ".";
        str[9] = alphabet[uint8(data[19] & 0x0f)];
        
        return string(str);
    }

    /**
     * @notice Internal function to send success notification
     * @param payer Address that initiated the payment
     * @param payee Address that received the payment
     * @param token Token address (address(0) for ETH)
     * @param amount Payment amount
     * @param paymentRef Reference string for the payment
     * @dev Best-effort notification - failures are silently ignored
     */
    function _notifySuccess(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string memory paymentRef
    ) private {
        if (notifier != address(0)) {
            try IOmniPayNotifier(notifier).notifyPaymentSuccess(
                payer,
                payee,
                token,
                amount,
                paymentRef
            ) {} catch {
                // Notification failure does not affect payment completion
            }
        }
    }

    /**
     * @notice Internal function to send failure notification
     * @param payer Address that initiated the payment
     * @param payee Address that should have received the payment
     * @param token Token address (address(0) for ETH)
     * @param amount Payment amount
     * @param paymentRef Reference string for the payment
     * @param reason Failure reason
     * @dev Best-effort notification - failures are silently ignored
     */
    function _notifyFailure(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string memory paymentRef,
        string memory reason
    ) private {
        if (notifier != address(0)) {
            try IOmniPayNotifier(notifier).notifyPaymentFailure(
                payer,
                payee,
                token,
                amount,
                paymentRef,
                reason
            ) {} catch {
                // Notification failure does not affect payment processing
            }
        }
    }

    /**
     * @notice Receives native ETH for liquidity
     */
    receive() external payable {}
}


================================================
FILE: contracts/OmniPayBridgeStub.sol
================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OmniPayBridgeStub
 * @notice Placeholder contract for cross-chain payment bridge functionality
 * @dev This stub emits events to track cross-chain payment intentions and completions
 *      without implementing actual cross-chain transfer logic. In production, this would
 *      integrate with bridge protocols like LayerZero, Axelar, or Wormhole.
 */
contract OmniPayBridgeStub is Ownable {
    /**
     * @notice Transaction status enumeration
     * @param Initiated Transaction has been initiated but not completed
     * @param Completed Transaction has been successfully completed
     * @param Failed Transaction has failed
     */
    enum TransactionStatus {
        Initiated,
        Completed,
        Failed
    }

    /**
     * @notice Cross-chain transaction record
     * @param localTxId Local transaction identifier
     * @param payer Address initiating the payment
     * @param payee Address receiving the payment
     * @param token Token address on the source chain
     * @param amount Payment amount
     * @param chain Target or source chain identifier
     * @param paymentRef External payment reference
     * @param timestamp Block timestamp when transaction was recorded
     * @param status Current transaction status
     */
    struct CrossChainTransaction {
        uint256 localTxId;
        address payer;
        address payee;
        address token;
        uint256 amount;
        string chain;
        string paymentRef;
        uint256 timestamp;
        TransactionStatus status;
    }

    /// @notice Emitted when a cross-chain payment is initiated from this chain
    event CrossChainPaymentInitiated(
        uint256 indexed localTxId,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 amount,
        string targetChain,
        string paymentRef
    );

    /// @notice Emitted when a cross-chain payment is completed on this chain
    event CrossChainPaymentCompleted(
        uint256 indexed localTxId,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 amount,
        string sourceChain,
        string paymentRef
    );

    /// @notice Emitted when a cross-chain payment fails
    event CrossChainPaymentFailed(
        uint256 indexed localTxId,
        address indexed payer,
        address indexed payee,
        string chain,
        string reason
    );

    /// @notice Emitted when an authorized operator is added
    event OperatorAdded(address indexed operator);

    /// @notice Emitted when an authorized operator is removed
    event OperatorRemoved(address indexed operator);

    /// @notice Counter for generating unique transaction IDs
    uint256 public nextTransactionId = 1;

    /// @notice Mapping from transaction ID to initiated transactions
    mapping(uint256 => CrossChainTransaction) public initiatedTransactions;

    /// @notice Mapping from transaction ID to completed transactions
    mapping(uint256 => CrossChainTransaction) public completedTransactions;

    /// @notice Mapping of authorized operators who can trigger bridge operations
    mapping(address => bool) public authorizedOperators;

    /// @notice Thrown when caller is not an authorized operator
    error UnauthorizedOperator();

    /// @notice Thrown when an invalid address is provided
    error InvalidAddress();

    /// @notice Thrown when an invalid amount is provided
    error InvalidAmount();

    /// @notice Thrown when an invalid chain identifier is provided
    error InvalidChain();

    /// @notice Thrown when a transaction ID already exists
    error TransactionAlreadyExists();

    /// @notice Thrown when a transaction is not found
    error TransactionNotFound();

    /**
     * @notice Contract constructor
     * @param initialOwner Address that will own the contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        // Owner is automatically an authorized operator
        authorizedOperators[initialOwner] = true;
        emit OperatorAdded(initialOwner);
    }

    /**
     * @notice Modifier to restrict access to authorized operators
     */
    modifier onlyOperator() {
        if (!authorizedOperators[msg.sender]) revert UnauthorizedOperator();
        _;
    }

    /**
     * @notice Add an authorized operator
     * @param operator Address to authorize
     */
    function addOperator(address operator) external onlyOwner {
        if (operator == address(0)) revert InvalidAddress();
        authorizedOperators[operator] = true;
        emit OperatorAdded(operator);
    }

    /**
     * @notice Remove an authorized operator
     * @param operator Address to deauthorize
     */
    function removeOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = false;
        emit OperatorRemoved(operator);
    }

    /**
     * @notice Initiate a cross-chain payment from this chain to another
     * @dev Records the transaction and emits an event for off-chain bridge monitoring
     * @param localTxId Unique identifier for this transaction
     * @param payer Address initiating the payment on this chain
     * @param payee Address that will receive payment on target chain
     * @param token Token contract address on this chain (address(0) for native token)
     * @param amount Amount to transfer
     * @param targetChain Identifier of the destination blockchain
     * @param paymentRef External reference string for payment tracking
     */
    function initiateCrossChainPayment(
        uint256 localTxId,
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata targetChain,
        string calldata paymentRef
    ) external onlyOperator {
        if (payer == address(0) || payee == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (bytes(targetChain).length == 0) revert InvalidChain();
        if (initiatedTransactions[localTxId].localTxId != 0) revert TransactionAlreadyExists();

        initiatedTransactions[localTxId] = CrossChainTransaction({
            localTxId: localTxId,
            payer: payer,
            payee: payee,
            token: token,
            amount: amount,
            chain: targetChain,
            paymentRef: paymentRef,
            timestamp: block.timestamp,
            status: TransactionStatus.Initiated
        });

        emit CrossChainPaymentInitiated(
            localTxId,
            payer,
            payee,
            token,
            amount,
            targetChain,
            paymentRef
        );
    }

    /**
     * @notice Complete a cross-chain payment received on this chain
     * @dev Records the completion and emits an event for tracking
     * @param localTxId Unique identifier for this transaction
     * @param payer Address that initiated payment on source chain
     * @param payee Address receiving payment on this chain
     * @param token Token contract address on this chain (address(0) for native token)
     * @param amount Amount transferred
     * @param sourceChain Identifier of the source blockchain
     * @param paymentRef External reference string for payment tracking
     */
    function completeCrossChainPayment(
        uint256 localTxId,
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata sourceChain,
        string calldata paymentRef
    ) external onlyOperator {
        if (payer == address(0) || payee == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (bytes(sourceChain).length == 0) revert InvalidChain();
        if (completedTransactions[localTxId].localTxId != 0) revert TransactionAlreadyExists();

        completedTransactions[localTxId] = CrossChainTransaction({
            localTxId: localTxId,
            payer: payer,
            payee: payee,
            token: token,
            amount: amount,
            chain: sourceChain,
            paymentRef: paymentRef,
            timestamp: block.timestamp,
            status: TransactionStatus.Completed
        });

        emit CrossChainPaymentCompleted(
            localTxId,
            payer,
            payee,
            token,
            amount,
            sourceChain,
            paymentRef
        );
    }

    /**
     * @notice Mark an initiated transaction as failed
     * @param localTxId Transaction identifier
     * @param reason Failure reason description
     */
    function markTransactionFailed(
        uint256 localTxId,
        string calldata reason
    ) external onlyOperator {
        CrossChainTransaction storage txn = initiatedTransactions[localTxId];
        if (txn.localTxId == 0) revert TransactionNotFound();

        txn.status = TransactionStatus.Failed;

        emit CrossChainPaymentFailed(
            localTxId,
            txn.payer,
            txn.payee,
            txn.chain,
            reason
        );
    }

    /**
     * @notice Generate a new unique transaction ID
     * @return txId The newly generated transaction ID
     */
    function generateTransactionId() external onlyOperator returns (uint256 txId) {
        txId = nextTransactionId++;
    }

    /**
     * @notice Get details of an initiated transaction
     * @param localTxId Transaction identifier
     * @return Transaction details
     */
    function getInitiatedTransaction(uint256 localTxId)
        external
        view
        returns (CrossChainTransaction memory)
    {
        if (initiatedTransactions[localTxId].localTxId == 0) revert TransactionNotFound();
        return initiatedTransactions[localTxId];
    }

    /**
     * @notice Get details of a completed transaction
     * @param localTxId Transaction identifier
     * @return Transaction details
     */
    function getCompletedTransaction(uint256 localTxId)
        external
        view
        returns (CrossChainTransaction memory)
    {
        if (completedTransactions[localTxId].localTxId == 0) revert TransactionNotFound();
        return completedTransactions[localTxId];
    }

    /**
     * @notice Check if an address is an authorized operator
     * @param operator Address to check
     * @return True if authorized, false otherwise
     */
    function isOperator(address operator) external view returns (bool) {
        return authorizedOperators[operator];
    }

    /**
     * @notice Get the status of an initiated transaction
     * @param localTxId Transaction identifier
     * @return status Current transaction status
     */
    function getTransactionStatus(uint256 localTxId)
        external
        view
        returns (TransactionStatus status)
    {
        if (initiatedTransactions[localTxId].localTxId == 0) revert TransactionNotFound();
        return initiatedTransactions[localTxId].status;
    }
}


================================================
FILE: contracts/OmniPayCore.sol
================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title IOmniPayNotifier
 * @notice Interface for payment notification callbacks
 * @dev Implement this interface to receive payment event notifications
 */
interface IOmniPayNotifier {
    /**
     * @notice Callback for successful payment notifications
     * @param payer Address that initiated the payment
     * @param payee Address that received the payment
     * @param token Token address (address(0) for native ETH)
     * @param amount Payment amount
     * @param paymentRef Reference string for the payment
     */
    function notifyPaymentSuccess(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef
    ) external;

    /**
     * @notice Callback for failed payment notifications
     * @param payer Address that initiated the payment
     * @param payee Intended recipient of the payment
     * @param token Token address (address(0) for native ETH)
     * @param amount Payment amount
     * @param paymentRef Reference string for the payment
     * @param reason Failure reason description
     */
    function notifyPaymentFailure(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef,
        string calldata reason
    ) external;
}

/**
 * @title OmniPayCore
 * @notice Core payment processing contract supporting ETH and ERC20 tokens
 * @dev Implements secure payment processing with event logging and optional notifications
 * @custom:security-contact security@omnipay.example
 */
contract OmniPayCore is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @notice Structure representing a completed transaction
    struct Transaction {
        address payer;          // Address that initiated the payment
        address payee;          // Address that received the payment
        address token;          // Token address (address(0) for native ETH)
        uint256 amount;         // Payment amount
        uint256 timestamp;      // Block timestamp when transaction completed
        string paymentRef;      // Reference string for payment tracking
    }

    /// @notice Emitted when a payment is initiated
    event PaymentInitiated(
        address indexed payer,
        address indexed payee,
        address indexed token,
        uint256 amount,
        string paymentRef
    );

    /// @notice Emitted when a payment is successfully completed
    event PaymentCompleted(
        uint256 indexed txId,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 amount,
        string paymentRef
    );

    /// @notice Emitted when a payment fails
    event PaymentFailed(
        address indexed payer,
        address indexed payee,
        address indexed token,
        uint256 amount,
        string paymentRef,
        string reason
    );

    /// @notice Emitted when the notifier address is updated
    event NotifierUpdated(address indexed oldNotifier, address indexed newNotifier);

    /// @notice Array storing all completed transactions
    Transaction[] public transactions;

    /// @notice Address of the notification contract (optional)
    address public notifier;

    /// @notice Maximum length for payment reference strings
    uint256 public constant MAX_PAYMENT_REF_LENGTH = 256;

    /**
     * @notice Contract constructor
     * @param _owner Initial owner of the contract
     * @param _notifier Initial notifier contract address (can be address(0))
     */
    constructor(address _owner, address _notifier) Ownable(_owner) {
        notifier = _notifier;
    }

    /**
     * @notice Updates the notifier contract address
     * @param _notifier New notifier address (address(0) to disable notifications)
     * @dev Only callable by contract owner
     */
    function setNotifier(address _notifier) external onlyOwner {
        address oldNotifier = notifier;
        notifier = _notifier;
        emit NotifierUpdated(oldNotifier, _notifier);
    }

    /**
     * @notice Process a payment in native ETH
     * @param payee Recipient address for the payment
     * @param paymentRef Reference string for payment tracking (max 256 chars)
     * @dev Requires msg.value > 0. Protected by reentrancy guard and pause mechanism
     */
    function payETH(address payable payee, string calldata paymentRef)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        require(payee != address(0), "OmniPay: Invalid payee address");
        require(msg.value > 0, "OmniPay: No ETH sent");
        require(bytes(paymentRef).length <= MAX_PAYMENT_REF_LENGTH, "OmniPay: Payment ref too long");

        emit PaymentInitiated(msg.sender, payee, address(0), msg.value, paymentRef);

        // Execute ETH transfer
        (bool success, ) = payee.call{value: msg.value}("");
        require(success, "OmniPay: ETH transfer failed");

        // Record transaction
        uint256 txId = _recordTransaction(
            msg.sender,
            payee,
            address(0),
            msg.value,
            paymentRef
        );

        emit PaymentCompleted(txId, msg.sender, payee, address(0), msg.value, paymentRef);

        // Attempt notification (best effort)
        _notifySuccess(msg.sender, payee, address(0), msg.value, paymentRef);
    }

    /**
     * @notice Process a payment in ERC20 tokens
     * @param token ERC20 token contract address
     * @param payee Recipient address for the payment
     * @param amount Token amount to transfer
     * @param paymentRef Reference string for payment tracking (max 256 chars)
     * @dev Requires prior token approval. Protected by reentrancy guard and pause mechanism
     */
    function payERC20(
        IERC20 token,
        address payee,
        uint256 amount,
        string calldata paymentRef
    ) external nonReentrant whenNotPaused {
        require(address(token) != address(0), "OmniPay: Invalid token address");
        require(payee != address(0), "OmniPay: Invalid payee address");
        require(amount > 0, "OmniPay: Amount must be greater than zero");
        require(bytes(paymentRef).length <= MAX_PAYMENT_REF_LENGTH, "OmniPay: Payment ref too long");

        emit PaymentInitiated(msg.sender, payee, address(token), amount, paymentRef);

        // Execute token transfer using SafeERC20
        token.safeTransferFrom(msg.sender, payee, amount);

        // Record transaction
        uint256 txId = _recordTransaction(
            msg.sender,
            payee,
            address(token),
            amount,
            paymentRef
        );

        emit PaymentCompleted(txId, msg.sender, payee, address(token), amount, paymentRef);

        // Attempt notification (best effort)
        _notifySuccess(msg.sender, payee, address(token), amount, paymentRef);
    }

    /**
     * @notice Returns the total number of recorded transactions
     * @return Total transaction count
     */
    function transactionCount() external view returns (uint256) {
        return transactions.length;
    }

    /**
     * @notice Retrieves a batch of transactions
     * @param startIndex Starting index (inclusive)
     * @param count Number of transactions to retrieve
     * @return Array of Transaction structs
     * @dev Reverts if indices are out of bounds
     */
    function getTransactions(uint256 startIndex, uint256 count)
        external
        view
        returns (Transaction[] memory)
    {
        require(startIndex < transactions.length, "OmniPay: Start index out of bounds");
        
        uint256 endIndex = startIndex + count;
        if (endIndex > transactions.length) {
            endIndex = transactions.length;
        }
        
        uint256 resultCount = endIndex - startIndex;
        Transaction[] memory result = new Transaction[](resultCount);
        
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = transactions[startIndex + i];
        }
        
        return result;
    }

    /**
     * @notice Pauses all payment operations
     * @dev Only callable by contract owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Resumes all payment operations
     * @dev Only callable by contract owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Internal function to record a completed transaction
     * @param payer Address that initiated the payment
     * @param payee Address that received the payment
     * @param token Token address (address(0) for ETH)
     * @param amount Payment amount
     * @param paymentRef Reference string for the payment
     * @return txId The ID of the recorded transaction
     */
    function _recordTransaction(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef
    ) private returns (uint256 txId) {
        transactions.push(
            Transaction({
                payer: payer,
                payee: payee,
                token: token,
                amount: amount,
                timestamp: block.timestamp,
                paymentRef: paymentRef
            })
        );
        return transactions.length - 1;
    }

    /**
     * @notice Internal function to send success notification
     * @param payer Address that initiated the payment
     * @param payee Address that received the payment
     * @param token Token address (address(0) for ETH)
     * @param amount Payment amount
     * @param paymentRef Reference string for the payment
     * @dev Best-effort notification - failures are silently ignored
     */
    function _notifySuccess(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef
    ) private {
        if (notifier != address(0)) {
            try IOmniPayNotifier(notifier).notifyPaymentSuccess(
                payer,
                payee,
                token,
                amount,
                paymentRef
            ) {} catch {
                // Notification failure does not affect payment completion
            }
        }
    }

    /**
     * @notice Internal function to send failure notification
     * @param payer Address that initiated the payment
     * @param payee Address that should have received the payment
     * @param token Token address (address(0) for ETH)
     * @param amount Payment amount
     * @param paymentRef Reference string for the payment
     * @param reason Failure reason
     * @dev Best-effort notification - failures are silently ignored
     */
    function _notifyFailure(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef,
        string calldata reason
    ) private {
        if (notifier != address(0)) {
            try IOmniPayNotifier(notifier).notifyPaymentFailure(
                payer,
                payee,
                token,
                amount,
                paymentRef,
                reason
            ) {} catch {
                // Notification failure does not affect payment processing
            }
        }
    }

    /**
     * @notice Prevents accidental ETH transfers to the contract
     * @dev Rejects all direct ETH transfers (use payETH function instead)
     */
    receive() external payable {
        revert("OmniPay: Use payETH function for payments");
    }
}


================================================
FILE: contracts/OmniPayNotifier.sol
================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title IPUSHCommInterface
 * @notice Minimal interface for Push Protocol (formerly EPNS) communication
 * @dev This interface should be adjusted based on the actual Push Protocol version being used
 */
interface IPUSHCommInterface {
    /**
     * @notice Send a notification through Push Protocol
     * @param channel Channel address sending the notification
     * @param recipient Address of the notification recipient
     * @param identity Encoded notification payload
     */
    function sendNotification(
        address channel,
        address recipient,
        bytes calldata identity
    ) external;
}

/**
 * @title OmniPayNotifier
 * @notice Centralized notification system for OmniPay ecosystem events
 * @dev Integrates with Push Protocol for decentralized notifications and emits events for off-chain indexing
 */
contract OmniPayNotifier is Ownable, AccessControl {
    /// @notice Role identifier for authorized notifier contracts
    bytes32 public constant NOTIFIER_ROLE = keccak256("NOTIFIER_ROLE");

    /// @notice Notification type enumeration for categorization
    enum NotificationType {
        PaymentSuccess,
        PaymentFailure,
        SubscriptionExecuted,
        SubscriptionCancelled,
        SubscriptionRenewalDue,
        Custom
    }

    /// @notice Push Protocol communication interface
    IPUSHCommInterface public pushComm;

    /// @notice Push Protocol channel address for this notifier
    address public channel;

    /// @notice Whether Push notifications are enabled
    bool public pushEnabled;

    /// @notice Emitted when Push Protocol configuration is updated
    event NotifierConfigured(
        address indexed pushComm,
        address indexed channel,
        bool pushEnabled
    );

    /// @notice Emitted before a subscription renewal is due
    event BeforeRenewal(
        uint256 indexed subId,
        address indexed subscriber,
        address indexed merchant,
        uint256 amount,
        uint256 nextPaymentDue
    );

    /// @notice Emitted when a payment succeeds
    event PaymentSuccess(
        address indexed payer,
        address indexed payee,
        address indexed token,
        uint256 amount,
        string paymentRef
    );

    /// @notice Emitted when a payment fails
    event PaymentFailure(
        address indexed payer,
        address indexed payee,
        address indexed token,
        uint256 amount,
        string paymentRef,
        string reason
    );

    /// @notice Emitted when a subscription payment is executed
    event SubscriptionExecuted(
        uint256 indexed subId,
        address indexed subscriber,
        address indexed merchant,
        address token,
        uint256 amount,
        uint256 nextPaymentDue
    );

    /// @notice Emitted when a subscription is cancelled
    event SubscriptionCancelled(
        uint256 indexed subId,
        address indexed subscriber,
        address indexed merchant
    );

    /// @notice Emitted when a Push notification is attempted
    event PushAttempt(
        address indexed recipient,
        NotificationType notificationType,
        bool success,
        bytes identity
    );

    /// @notice Emitted when a custom notification is sent
    event CustomNotification(
        address indexed recipient,
        string title,
        string body,
        bytes metadata
    );

    /// @notice Thrown when an invalid address is provided
    error InvalidAddress();

    /// @notice Thrown when Push Protocol is not properly configured
    error PushNotConfigured();

    /// @notice Thrown when caller lacks required authorization
    error UnauthorizedCaller();

    /**
     * @notice Contract constructor
     * @param initialOwner Address that will own the contract
     * @param _pushComm Address of Push Protocol communication contract
     * @param _channel Address of the Push Protocol channel
     */
    constructor(
        address initialOwner,
        address _pushComm,
        address _channel
    ) Ownable(initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(NOTIFIER_ROLE, initialOwner);

        if (_pushComm != address(0)) {
            pushComm = IPUSHCommInterface(_pushComm);
            pushEnabled = true;
        }
        channel = _channel;

        emit NotifierConfigured(_pushComm, _channel, pushEnabled);
    }

    /**
     * @notice Update Push Protocol communication contract address
     * @param _pushComm New Push Protocol contract address
     */
    function setPushComm(address _pushComm) external onlyOwner {
        pushComm = IPUSHCommInterface(_pushComm);
        pushEnabled = _pushComm != address(0);
        emit NotifierConfigured(_pushComm, channel, pushEnabled);
    }

    /**
     * @notice Update Push Protocol channel address
     * @param _channel New channel address
     */
    function setChannel(address _channel) external onlyOwner {
        channel = _channel;
        emit NotifierConfigured(address(pushComm), _channel, pushEnabled);
    }

    /**
     * @notice Enable or disable Push notifications
     * @param enabled True to enable, false to disable
     */
    function setPushEnabled(bool enabled) external onlyOwner {
        pushEnabled = enabled;
        emit NotifierConfigured(address(pushComm), channel, enabled);
    }

    /**
     * @notice Grant notifier role to an address
     * @param notifier Address to grant role to
     */
    function grantNotifierRole(address notifier) external onlyOwner {
        if (notifier == address(0)) revert InvalidAddress();
        _grantRole(NOTIFIER_ROLE, notifier);
    }

    /**
     * @notice Revoke notifier role from an address
     * @param notifier Address to revoke role from
     */
    function revokeNotifierRole(address notifier) external onlyOwner {
        _revokeRole(NOTIFIER_ROLE, notifier);
    }

    /**
     * @notice Notify subscriber before renewal is due
     * @param subId Subscription identifier
     * @param subscriber Subscriber address
     * @param merchant Merchant address
     * @param amount Payment amount
     * @param nextPaymentDue Timestamp when payment is due
     */
    function notifyBeforeRenewal(
        uint256 subId,
        address subscriber,
        address merchant,
        uint256 amount,
        uint256 nextPaymentDue
    ) external onlyRole(NOTIFIER_ROLE) {
        emit BeforeRenewal(subId, subscriber, merchant, amount, nextPaymentDue);

        _sendPushNotification(
            subscriber,
            NotificationType.SubscriptionRenewalDue,
            _buildIdentity(
                "Subscription Renewal Due",
                "Your subscription payment is due soon. Please ensure sufficient balance."
            )
        );

        _sendPushNotification(
            merchant,
            NotificationType.SubscriptionRenewalDue,
            _buildIdentity(
                "Upcoming Subscription Payment",
                "A subscriber has an upcoming payment due."
            )
        );
    }

    /**
     * @notice Notify parties after payment success
     * @param payer Address that initiated payment
     * @param payee Address that received payment
     * @param token Token address (address(0) for ETH)
     * @param amount Payment amount
     * @param paymentRef External payment reference
     */
    function notifyPaymentSuccess(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef
    ) external onlyRole(NOTIFIER_ROLE) {
        emit PaymentSuccess(payer, payee, token, amount, paymentRef);

        _sendPushNotification(
            payer,
            NotificationType.PaymentSuccess,
            _buildIdentity(
                "Payment Successful",
                string(abi.encodePacked("Your payment of ", _formatAmount(amount), " was completed successfully."))
            )
        );

        _sendPushNotification(
            payee,
            NotificationType.PaymentSuccess,
            _buildIdentity(
                "Payment Received",
                string(abi.encodePacked("You received a payment of ", _formatAmount(amount), "."))
            )
        );
    }

    /**
     * @notice Notify parties after payment failure
     * @param payer Address that initiated payment
     * @param payee Address that should have received payment
     * @param token Token address (address(0) for ETH)
     * @param amount Payment amount
     * @param paymentRef External payment reference
     * @param reason Failure reason
     */
    function notifyPaymentFailure(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef,
        string calldata reason
    ) external onlyRole(NOTIFIER_ROLE) {
        emit PaymentFailure(payer, payee, token, amount, paymentRef, reason);

        string memory payerBody = string(
            abi.encodePacked("Your payment of ", _formatAmount(amount), " failed. Reason: ", reason)
        );
        _sendPushNotification(
            payer,
            NotificationType.PaymentFailure,
            _buildIdentity("Payment Failed", payerBody)
        );

        string memory payeeBody = string(
            abi.encodePacked("Expected payment of ", _formatAmount(amount), " failed. Reason: ", reason)
        );
        _sendPushNotification(
            payee,
            NotificationType.PaymentFailure,
            _buildIdentity("Payment Failed", payeeBody)
        );
    }

    /**
     * @notice Notify after subscription payment execution
     * @param subId Subscription identifier
     * @param subscriber Subscriber address
     * @param merchant Merchant address
     * @param token Token address (address(0) for ETH)
     * @param amount Payment amount
     * @param nextPaymentDue Timestamp when next payment is due
     */
    function notifySubscriptionExecuted(
        uint256 subId,
        address subscriber,
        address merchant,
        address token,
        uint256 amount,
        uint256 nextPaymentDue
    ) external onlyRole(NOTIFIER_ROLE) {
        emit SubscriptionExecuted(subId, subscriber, merchant, token, amount, nextPaymentDue);

        _sendPushNotification(
            subscriber,
            NotificationType.SubscriptionExecuted,
            _buildIdentity(
                "Subscription Payment Processed",
                string(abi.encodePacked("Your subscription of ", _formatAmount(amount), " was charged successfully."))
            )
        );

        _sendPushNotification(
            merchant,
            NotificationType.SubscriptionExecuted,
            _buildIdentity(
                "Subscription Payment Received",
                string(abi.encodePacked("Received subscription payment of ", _formatAmount(amount), "."))
            )
        );
    }

    /**
     * @notice Notify after subscription cancellation
     * @param subId Subscription identifier
     * @param subscriber Subscriber address
     * @param merchant Merchant address
     */
    function notifySubscriptionCancelled(
        uint256 subId,
        address subscriber,
        address merchant
    ) external onlyRole(NOTIFIER_ROLE) {
        emit SubscriptionCancelled(subId, subscriber, merchant);

        _sendPushNotification(
            subscriber,
            NotificationType.SubscriptionCancelled,
            _buildIdentity(
                "Subscription Cancelled",
                "Your subscription has been cancelled successfully."
            )
        );

        _sendPushNotification(
            merchant,
            NotificationType.SubscriptionCancelled,
            _buildIdentity(
                "Subscription Cancelled",
                "A subscriber has cancelled their subscription."
            )
        );
    }

    /**
     * @notice Send a custom notification to a recipient
     * @param recipient Address to receive notification
     * @param title Notification title
     * @param body Notification body
     * @param metadata Additional metadata (optional)
     */
    function sendCustomNotification(
        address recipient,
        string calldata title,
        string calldata body,
        bytes calldata metadata
    ) external onlyRole(NOTIFIER_ROLE) {
        if (recipient == address(0)) revert InvalidAddress();

        emit CustomNotification(recipient, title, body, metadata);

        _sendPushNotification(
            recipient,
            NotificationType.Custom,
            _buildIdentity(title, body)
        );
    }

    /**
     * @notice Send bulk notifications to multiple recipients
     * @param recipients Array of recipient addresses
     * @param title Notification title
     * @param body Notification body
     */
    function sendBulkNotification(
        address[] calldata recipients,
        string calldata title,
        string calldata body
    ) external onlyRole(NOTIFIER_ROLE) {
        bytes memory identity = _buildIdentity(title, body);

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] != address(0)) {
                _sendPushNotification(recipients[i], NotificationType.Custom, identity);
            }
        }
    }

    /**
     * @dev Internal function to send Push notification
     * @param recipient Notification recipient
     * @param notificationType Type of notification
     * @param identity Encoded notification payload
     */
    function _sendPushNotification(
        address recipient,
        NotificationType notificationType,
        bytes memory identity
    ) internal {
        if (!pushEnabled || address(pushComm) == address(0) || channel == address(0)) {
            emit PushAttempt(recipient, notificationType, false, identity);
            return;
        }

        try pushComm.sendNotification(channel, recipient, identity) {
            emit PushAttempt(recipient, notificationType, true, identity);
        } catch {
            emit PushAttempt(recipient, notificationType, false, identity);
        }
    }

    /**
     * @dev Build notification identity payload according to Push Protocol format
     * @param title Notification title
     * @param body Notification body
     * @return Encoded identity bytes
     */
    function _buildIdentity(string memory title, string memory body)
        internal
        pure
        returns (bytes memory)
    {
        // Push Protocol notification format: "0+title+body"
        // The format may need adjustment based on Push Protocol version
        string memory payload = string(
            abi.encodePacked(
                "0", // Notification type (0 for basic notification)
                "+",
                title,
                "+",
                body
            )
        );
        return bytes(payload);
    }

    /**
     * @dev Format amount for display in notifications
     * @param amount Amount to format
     * @return Formatted string representation
     */
    function _formatAmount(uint256 amount) internal pure returns (string memory) {
        // Simple amount formatting - can be enhanced for better readability
        return _uintToString(amount);
    }

    /**
     * @dev Convert uint256 to string
     * @param value Value to convert
     * @return String representation
     */
    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;

        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);

        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }

        return string(buffer);
    }
}


================================================
FILE: contracts/OmniPaySettlement.sol
================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

/**
 * @title IOmniPayNotifier
 * @notice Interface for external notification systems to receive payment status updates
 */
interface IOmniPayNotifier {
    /**
     * @notice Notify external system of successful payment
     * @param payer Address that initiated the payment
     * @param payee Address that received the payment
     * @param token Token address (address(0) for native ETH)
     * @param amount Payment amount
     * @param paymentRef External reference identifier for the payment
     */
    function notifyPaymentSuccess(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef
    ) external;

    /**
     * @notice Notify external system of failed payment
     * @param payer Address that initiated the payment
     * @param payee Address that should have received the payment
     * @param token Token address (address(0) for native ETH)
     * @param amount Payment amount
     * @param paymentRef External reference identifier for the payment
     * @param reason Failure reason description
     */
    function notifyPaymentFailure(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef,
        string calldata reason
    ) external;
}

/**
 * @title OmniPaySettlement
 * @notice A flexible payment settlement contract supporting ERC20 tokens and native ETH
 * @dev Supports both standard approve/transferFrom flow and gasless EIP-2612 permit signatures
 * @custom:security-contact security@omnipay.example
 */
contract OmniPaySettlement is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @notice Settlement status enumeration
    enum SettlementStatus {
        Pending,
        Executed,
        Cancelled
    }

    /**
     * @notice Settlement structure containing all payment details
     * @param payer Address initiating the payment
     * @param payee Address receiving the payment
     * @param token Token contract address (address(0) for native ETH)
     * @param amount Payment amount in token's smallest unit
     * @param timestamp Block timestamp when settlement was created
     * @param paymentRef External reference string for tracking
     * @param status Current status of the settlement
     * @param executor Address that executed the settlement (address(0) if not executed)
     */
    struct Settlement {
        address payer;
        address payee;
        address token;
        uint256 amount;
        uint256 timestamp;
        string paymentRef;
        SettlementStatus status;
        address executor;
    }

    /// @notice Emitted when a new settlement is created
    event SettlementCreated(
        uint256 indexed settlementId,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 amount,
        string paymentRef
    );

    /// @notice Emitted when a settlement is successfully executed
    event SettlementExecuted(
        uint256 indexed settlementId,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 amount,
        address executor,
        string paymentRef
    );

    /// @notice Emitted when a settlement is cancelled by the payer
    event SettlementCancelled(
        uint256 indexed settlementId,
        address indexed payer,
        string paymentRef
    );

    /// @notice Emitted when a settlement fails
    event SettlementFailed(
        uint256 indexed settlementId,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 amount,
        string paymentRef,
        string reason
    );

    /// @notice Emitted when the notifier address is updated
    event NotifierUpdated(address indexed oldNotifier, address indexed newNotifier);

    /// @notice Array storing all settlements
    Settlement[] public settlements;

    /// @notice Address of the external notifier contract
    address public notifier;

    /// @notice Maximum length for payment reference strings
    uint256 public constant MAX_PAYMENT_REF_LENGTH = 256;

    /// @notice Settlement expiration period (30 days)
    uint256 public constant SETTLEMENT_EXPIRY = 30 days;

    /// @notice Mapping to track if a permit signature has been used (prevents replay)
    mapping(bytes32 => bool) public usedPermits;

    /// @notice Thrown when an invalid address is provided
    error InvalidAddress();

    /// @notice Thrown when an invalid amount is provided
    error InvalidAmount();

    /// @notice Thrown when an invalid settlement ID is provided
    error InvalidSettlementId();

    /// @notice Thrown when attempting to execute an already executed settlement
    error SettlementAlreadyExecuted();

    /// @notice Thrown when using the wrong execution method for the token type
    error InvalidExecutionMethod();

    /// @notice Thrown when unauthorized access is attempted
    error UnauthorizedAccess();

    /// @notice Thrown when incorrect ETH amount is sent
    error IncorrectEthAmount();

    /// @notice Thrown when ETH transfer fails
    error EthTransferFailed();

    /// @notice Thrown when attempting to cancel an already executed settlement
    error CannotCancelExecutedSettlement();

    /// @notice Thrown when payment reference exceeds maximum length
    error PaymentRefTooLong();

    /// @notice Thrown when settlement has expired
    error SettlementExpired();

    /// @notice Thrown when permit signature has already been used
    error PermitAlreadyUsed();

    /// @notice Thrown when token contract validation fails
    error InvalidTokenContract();

    /**
     * @notice Contract constructor
     * @param initialOwner Address that will own the contract
     * @param _notifier Address of the notification contract
     */
    constructor(address initialOwner, address _notifier) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert InvalidAddress();
        notifier = _notifier;
    }

    /**
     * @notice Update the notifier contract address
     * @param _notifier New notifier contract address (address(0) to disable)
     * @dev Only callable by contract owner
     */
    function setNotifier(address _notifier) external onlyOwner {
        address oldNotifier = notifier;
        notifier = _notifier;
        emit NotifierUpdated(oldNotifier, _notifier);
    }

    /**
     * @notice Create a new settlement that can be executed later
     * @param payee Recipient address
     * @param token ERC20 token address (use address(0) for native ETH)
     * @param amount Amount to be settled
     * @param paymentRef External reference string for payment tracking
     * @return settlementId The ID of the newly created settlement
     * @dev Settlement creation does not transfer funds - use execute functions for that
     */
    function createSettlement(
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef
    ) external whenNotPaused returns (uint256 settlementId) {
        if (payee == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (bytes(paymentRef).length > MAX_PAYMENT_REF_LENGTH) revert PaymentRefTooLong();

        // Validate token contract if not ETH
        if (token != address(0) && token.code.length == 0) {
            revert InvalidTokenContract();
        }

        settlementId = settlements.length;

        settlements.push(
            Settlement({
                payer: msg.sender,
                payee: payee,
                token: token,
                amount: amount,
                timestamp: block.timestamp,
                paymentRef: paymentRef,
                status: SettlementStatus.Pending,
                executor: address(0)
            })
        );

        emit SettlementCreated(settlementId, msg.sender, payee, token, amount, paymentRef);
    }

    /**
     * @notice Execute an ERC20 settlement with pre-approved tokens
     * @dev Payer must have approved this contract to spend tokens before calling
     * @dev Can be called by anyone if payer has approved the contract
     * @param settlementId ID of the settlement to execute
     */
    function executeSettlement(uint256 settlementId) external nonReentrant whenNotPaused {
        Settlement storage settlement = _validateAndGetSettlement(settlementId);
        if (settlement.token == address(0)) revert InvalidExecutionMethod();

        _executeSettlement(settlement, settlementId, msg.sender);

        IERC20(settlement.token).safeTransferFrom(
            settlement.payer,
            settlement.payee,
            settlement.amount
        );
    }

    /**
     * @notice Execute an ERC20 settlement using EIP-2612 permit signature
     * @dev Enables gasless approval - payer doesn't need to send approval transaction first
     * @dev Can be called by anyone with valid permit signature
     * @param settlementId ID of the settlement to execute
     * @param deadline Permit expiration timestamp
     * @param v ECDSA signature parameter
     * @param r ECDSA signature parameter
     * @param s ECDSA signature parameter
     */
    function executeSettlementWithPermit(
        uint256 settlementId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant whenNotPaused {
        Settlement storage settlement = _validateAndGetSettlement(settlementId);
        if (settlement.token == address(0)) revert InvalidExecutionMethod();

        // Check permit hasn't been used (prevent replay attacks)
        bytes32 permitHash = keccak256(
            abi.encodePacked(settlementId, deadline, v, r, s)
        );
        if (usedPermits[permitHash]) revert PermitAlreadyUsed();
        usedPermits[permitHash] = true;

        _executeSettlement(settlement, settlementId, msg.sender);

        // Execute permit to grant approval
        IERC20Permit(settlement.token).permit(
            settlement.payer,
            address(this),
            settlement.amount,
            deadline,
            v,
            r,
            s
        );

        // Transfer tokens from payer to payee
        IERC20(settlement.token).safeTransferFrom(
            settlement.payer,
            settlement.payee,
            settlement.amount
        );
    }

    /**
     * @notice Execute a native ETH settlement
     * @dev Only the payer can execute and must send exact amount
     * @param settlementId ID of the settlement to execute
     */
    function executeETHSettlement(uint256 settlementId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        Settlement storage settlement = _validateAndGetSettlement(settlementId);
        if (settlement.token != address(0)) revert InvalidExecutionMethod();
        if (msg.sender != settlement.payer) revert UnauthorizedAccess();
        if (msg.value != settlement.amount) revert IncorrectEthAmount();

        _executeSettlement(settlement, settlementId, msg.sender);

        (bool success, ) = settlement.payee.call{value: settlement.amount}("");
        if (!success) revert EthTransferFailed();
    }

    /**
     * @notice Execute a settlement by anyone on behalf of payer (with pre-approval)
     * @dev Useful for third-party relayers or automated systems
     * @param settlementId ID of the settlement to execute
     */
    function executeSettlementOnBehalf(uint256 settlementId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        Settlement storage settlement = _validateAndGetSettlement(settlementId);
        if (settlement.token == address(0)) revert InvalidExecutionMethod();

        _executeSettlement(settlement, settlementId, msg.sender);

        IERC20(settlement.token).safeTransferFrom(
            settlement.payer,
            settlement.payee,
            settlement.amount
        );
    }

    /**
     * @notice Cancel a pending settlement
     * @dev Only the payer can cancel, and only before execution
     * @param settlementId ID of the settlement to cancel
     */
    function cancelSettlement(uint256 settlementId) external {
        if (settlementId >= settlements.length) revert InvalidSettlementId();

        Settlement storage settlement = settlements[settlementId];
        if (msg.sender != settlement.payer && msg.sender != owner()) {
            revert UnauthorizedAccess();
        }
        if (settlement.status != SettlementStatus.Pending) {
            revert CannotCancelExecutedSettlement();
        }

        settlement.status = SettlementStatus.Cancelled;

        emit SettlementCancelled(settlementId, settlement.payer, settlement.paymentRef);

        // Notify cancellation
        _notifyPaymentFailure(settlement, "Settlement cancelled by payer");
    }

    /**
     * @notice Batch cancel multiple settlements
     * @dev Only callable by payer of all settlements
     * @param settlementIds Array of settlement IDs to cancel
     */
    function batchCancelSettlements(uint256[] calldata settlementIds) external {
        for (uint256 i = 0; i < settlementIds.length; i++) {
            uint256 settlementId = settlementIds[i];
            if (settlementId >= settlements.length) continue;

            Settlement storage settlement = settlements[settlementId];
            if (settlement.payer != msg.sender) continue;
            if (settlement.status != SettlementStatus.Pending) continue;

            settlement.status = SettlementStatus.Cancelled;
            emit SettlementCancelled(settlementId, settlement.payer, settlement.paymentRef);
            _notifyPaymentFailure(settlement, "Settlement cancelled by payer");
        }
    }

    /**
     * @notice Retrieve settlement details
     * @param settlementId ID of the settlement
     * @return Settlement struct containing all settlement data
     */
    function getSettlement(uint256 settlementId) external view returns (Settlement memory) {
        if (settlementId >= settlements.length) revert InvalidSettlementId();
        return settlements[settlementId];
    }

    /**
     * @notice Get total number of settlements created
     * @return Total settlement count
     */
    function settlementCount() external view returns (uint256) {
        return settlements.length;
    }

    /**
     * @notice Get all settlement IDs for a specific payer
     * @param payer Address of the payer
     * @return Array of settlement IDs
     */
    function getPayerSettlements(address payer) external view returns (uint256[] memory) {
        return _getSettlementsByAddress(payer, true);
    }

    /**
     * @notice Get all settlement IDs for a specific payee
     * @param payee Address of the payee
     * @return Array of settlement IDs
     */
    function getPayeeSettlements(address payee) external view returns (uint256[] memory) {
        return _getSettlementsByAddress(payee, false);
    }

    /**
     * @notice Get settlements with specific status
     * @param status Status to filter by
     * @param startIndex Starting index for pagination
     * @param count Number of settlements to return
     * @return Array of settlements matching the status
     */
    function getSettlementsByStatus(
        SettlementStatus status,
        uint256 startIndex,
        uint256 count
    ) external view returns (Settlement[] memory) {
        uint256 totalCount = settlements.length;
        uint256[] memory matchingIds = new uint256[](totalCount);
        uint256 matchCount = 0;

        for (uint256 i = 0; i < totalCount; i++) {
            if (settlements[i].status == status) {
                matchingIds[matchCount] = i;
                matchCount++;
            }
        }

        // Calculate return array size
        uint256 returnStart = startIndex > matchCount ? matchCount : startIndex;
        uint256 returnEnd = returnStart + count > matchCount ? matchCount : returnStart + count;
        uint256 returnSize = returnEnd - returnStart;

        Settlement[] memory result = new Settlement[](returnSize);
        for (uint256 i = 0; i < returnSize; i++) {
            result[i] = settlements[matchingIds[returnStart + i]];
        }

        return result;
    }

    /**
     * @notice Check if a settlement has expired
     * @param settlementId ID of the settlement
     * @return True if settlement has expired
     */
    function isSettlementExpired(uint256 settlementId) external view returns (bool) {
        if (settlementId >= settlements.length) revert InvalidSettlementId();
        Settlement storage settlement = settlements[settlementId];
        return block.timestamp > settlement.timestamp + SETTLEMENT_EXPIRY;
    }

    /**
     * @notice Pauses all settlement operations
     * @dev Only callable by contract owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Resumes all settlement operations
     * @dev Only callable by contract owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdrawal function for owner
     * @param token Token to withdraw (address(0) for native ETH)
     * @param amount Amount to withdraw
     * @dev Only callable by contract owner. Use with extreme caution
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH balance");
            (bool success, ) = owner().call{value: amount}("");
            if (!success) revert EthTransferFailed();
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    /**
     * @dev Internal function to validate settlement and return storage reference
     * @param settlementId ID of the settlement to validate
     * @return settlement Storage reference to the settlement
     */
    function _validateAndGetSettlement(uint256 settlementId)
        internal
        view
        returns (Settlement storage settlement)
    {
        if (settlementId >= settlements.length) revert InvalidSettlementId();
        settlement = settlements[settlementId];
        if (settlement.status != SettlementStatus.Pending) {
            revert SettlementAlreadyExecuted();
        }
        if (block.timestamp > settlement.timestamp + SETTLEMENT_EXPIRY) {
            revert SettlementExpired();
        }
    }

    /**
     * @dev Internal function to mark settlement as executed
     * @param settlement The settlement to execute
     * @param settlementId The settlement ID
     * @param executor Address executing the settlement
     */
    function _executeSettlement(
        Settlement storage settlement,
        uint256 settlementId,
        address executor
    ) internal {
        settlement.status = SettlementStatus.Executed;
        settlement.executor = executor;

        emit SettlementExecuted(
            settlementId,
            settlement.payer,
            settlement.payee,
            settlement.token,
            settlement.amount,
            executor,
            settlement.paymentRef
        );
    }

    /**
     * @dev Internal function to notify external system of successful payment
     * @param settlement The executed settlement
     * @param settlementId The settlement ID (unused but kept for extensibility)
     */
    function _notifyPaymentSuccess(
        Settlement storage settlement,
        uint256 settlementId
    ) internal {
        if (notifier != address(0)) {
            try IOmniPayNotifier(notifier).notifyPaymentSuccess(
                settlement.payer,
                settlement.payee,
                settlement.token,
                settlement.amount,
                settlement.paymentRef
            ) {} catch {
                // Best-effort notification; failures are silently ignored
            }
        }
    }

    /**
     * @dev Internal function to notify external system of failed payment
     * @param settlement The failed settlement
     * @param reason Failure reason
     */
    function _notifyPaymentFailure(
        Settlement storage settlement,
        string memory reason
    ) internal {
        if (notifier != address(0)) {
            try IOmniPayNotifier(notifier).notifyPaymentFailure(
                settlement.payer,
                settlement.payee,
                settlement.token,
                settlement.amount,
                settlement.paymentRef,
                reason
            ) {} catch {
                // Best-effort notification
            }
        }
    }

    /**
     * @dev Internal helper to get settlements filtered by address
     * @param addr Address to filter by
     * @param isPayer True to filter by payer, false to filter by payee
     * @return Array of settlement IDs
     */
    function _getSettlementsByAddress(address addr, bool isPayer)
        internal
        view
        returns (uint256[] memory)
    {
        uint256 totalCount = settlements.length;
        uint256[] memory tempResult = new uint256[](totalCount);
        uint256 count = 0;

        for (uint256 i = 0; i < totalCount; i++) {
            address compareTo = isPayer ? settlements[i].payer : settlements[i].payee;
            if (compareTo == addr) {
                tempResult[count] = i;
                count++;
            }
        }

        // Create properly sized result array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tempResult[i];
        }

        return result;
    }

    /**
     * @notice Prevents accidental ETH transfers to the contract
     * @dev Only accepts ETH through executeETHSettlement function
     */
    receive() external payable {
        revert("Use executeETHSettlement function");
    }
}


================================================
FILE: contracts/OmniPaySubscription.sol
================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title IOmniPayNotifier
 * @notice Interface for payment notification callbacks
 */
interface IOmniPayNotifier {
    function notifyPaymentSuccess(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef
    ) external;

    function notifyPaymentFailure(
        address payer,
        address payee,
        address token,
        uint256 amount,
        string calldata paymentRef,
        string calldata reason
    ) external;

    function notifySubscriptionExecuted(
        uint256 subId,
        address subscriber,
        address merchant,
        address token,
        uint256 amount,
        uint256 nextPaymentDue
    ) external;

    function notifySubscriptionCancelled(uint256 subId, address subscriber, address merchant) external;
}

contract OmniPaySubscription is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Subscription {
        uint256 id;
        address subscriber;
        address merchant;
        address token; // address(0) for ETH
        uint256 amount;
        uint256 interval; // seconds
        uint256 nextPaymentDue;
        bool active;
    }

    event SubscriptionCreated(
        uint256 indexed id,
        address indexed subscriber,
        address indexed merchant,
        address token,
        uint256 amount,
        uint256 interval,
        uint256 nextPaymentDue
    );
    event SubscriptionExecuted(
        uint256 indexed id,
        address indexed subscriber,
        address indexed merchant,
        address token,
        uint256 amount,
        uint256 nextPaymentDue
    );
    event SubscriptionCancelled(uint256 indexed id, address indexed subscriber, address indexed merchant);
    
    event SubscriptionFailed(
        uint256 indexed id,
        address indexed subscriber,
        address indexed merchant,
        address token,
        uint256 amount,
        string reason
    );

    uint256 public nextId = 1;
    mapping(uint256 => Subscription) public subscriptions;
    address public notifier;

    constructor(address _notifier) Ownable(msg.sender) {
        notifier = _notifier;
    }

    function setNotifier(address _notifier) external onlyOwner {
        notifier = _notifier;
    }

    /// @notice Create a new subscription
    /// @param merchant Merchant to receive payments
    /// @param token ERC-20 token address or address(0) for ETH
    /// @param amount Amount per interval (ETH wei or token units)
    /// @param intervalSeconds Interval in seconds between payments
    function createSubscription(
        address merchant,
        address token,
        uint256 amount,
        uint256 intervalSeconds
    ) external returns (uint256 id) {
        require(merchant != address(0), "Invalid merchant");
        require(merchant != msg.sender, "Cannot subscribe to yourself");
        require(amount > 0, "Amount = 0");
        require(intervalSeconds >= 60, "Interval too short");
        require(intervalSeconds <= 365 days, "Interval too long");

        id = nextId++;
        subscriptions[id] = Subscription({
            id: id,
            subscriber: msg.sender,
            merchant: merchant,
            token: token,
            amount: amount,
            interval: intervalSeconds,
            nextPaymentDue: block.timestamp + intervalSeconds,
            active: true
        });

        emit SubscriptionCreated(id, msg.sender, merchant, token, amount, intervalSeconds, subscriptions[id].nextPaymentDue);
    }

    /// @notice Execute a due subscription payment
    /// @param id Subscription id
    function executeSubscription(uint256 id) external payable nonReentrant {
        require(id > 0 && id < nextId, "Invalid subscription ID");
        Subscription storage s = subscriptions[id];
        require(s.active, "Inactive");
        require(s.subscriber == msg.sender, "Only subscriber");
        require(block.timestamp >= s.nextPaymentDue, "Not due");

        (bool paymentSuccess, string memory failureReason) = _processPayment(s);

        if (paymentSuccess) {
            _onPaymentSuccess(s);
        } else {
            _onPaymentFailure(s, failureReason);
        }
    }

    function _processPayment(Subscription storage s) private returns (bool success, string memory reason) {
        if (s.token == address(0)) {
            return _processEthPayment(s);
        } else {
            return _processTokenPayment(s);
        }
    }

    function _processEthPayment(Subscription storage s) private returns (bool success, string memory reason) {
        if (msg.value != s.amount) {
            return (false, "Incorrect ETH amount");
        }
        (bool ok, ) = payable(s.merchant).call{value: s.amount}("");
        if (!ok) {
            return (false, "ETH transfer failed");
        }
        return (true, "");
    }

    function _processTokenPayment(Subscription storage s) private returns (bool success, string memory reason) {
        if (msg.value != 0) {
            return (false, "No ETH needed for token payment");
        }
        try IERC20(s.token).transferFrom(s.subscriber, s.merchant, s.a