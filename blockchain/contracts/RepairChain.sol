// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title RepairChain
 * @notice Blockchain-based lifetime repair and ownership passport for physical products.
 *         Only minimal identifiers and event hashes are stored on-chain.
 *         Full repair details are stored off-chain (MongoDB) and hashed for integrity.
 */
contract RepairChain {
    // ─────────────────────────────────────────────────────────────────────────
    // State Variables
    // ─────────────────────────────────────────────────────────────────────────

    address public admin;

    struct Product {
        string  productId;
        string  serialNumber;
        address owner;
        bool    exists;
        bool    transferPending;
        address pendingNewOwner;
        uint256 registeredAt;
    }

    struct LifecycleEvent {
        bytes32 eventHash;
        address submitter;
        uint256 timestamp;
        string  eventType;
    }

    // productId => Product
    mapping(string => Product) private products;

    // serialNumber => productId (prevents duplicate serial numbers)
    mapping(string => string) private serialToProductId;

    // productId => lifecycle events array
    mapping(string => LifecycleEvent[]) private lifecycleEvents;

    // address => isAuthorized
    mapping(address => bool) public authorizedServiceCenters;

    // Track all product IDs for enumeration
    string[] private allProductIds;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event ProductRegistered(
        string indexed productId,
        string serialNumber,
        address indexed owner,
        uint256 timestamp
    );

    event ServiceCenterAuthorized(address indexed serviceCenterAddress, uint256 timestamp);
    event ServiceCenterDeactivated(address indexed serviceCenterAddress, uint256 timestamp);

    event LifecycleEventRecorded(
        string  indexed productId,
        bytes32         eventHash,
        string          eventType,
        address indexed submitter,
        uint256         eventIndex,
        uint256         timestamp
    );

    event OwnershipTransferInitiated(
        string  indexed productId,
        address indexed from,
        address indexed to,
        uint256         timestamp
    );

    event OwnershipTransferAccepted(
        string  indexed productId,
        address indexed newOwner,
        uint256         timestamp
    );

    event OwnershipTransferCancelled(
        string  indexed productId,
        uint256         timestamp
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "RepairChain: caller is not admin");
        _;
    }

    modifier onlyAuthorizedServiceCenter() {
        require(
            authorizedServiceCenters[msg.sender],
            "RepairChain: caller is not an authorized service center"
        );
        _;
    }

    modifier productExists(string memory productId) {
        require(products[productId].exists, "RepairChain: product does not exist");
        _;
    }

    modifier onlyProductOwner(string memory productId) {
        require(
            products[productId].owner == msg.sender,
            "RepairChain: caller is not the product owner"
        );
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor() {
        admin = msg.sender;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Register a new product. Only admin may call this.
     * @param productId      Unique RepairChain product ID (e.g. "RC-00001")
     * @param serialNumber   Manufacturer serial number
     * @param initialOwner   Wallet address of the initial owner
     */
    function registerProduct(
        string memory productId,
        string memory serialNumber,
        address initialOwner
    ) external onlyAdmin {
        require(bytes(productId).length > 0,     "RepairChain: empty productId");
        require(bytes(serialNumber).length > 0,  "RepairChain: empty serialNumber");
        require(!products[productId].exists,     "RepairChain: productId already registered");
        require(
            bytes(serialToProductId[serialNumber]).length == 0,
            "RepairChain: serialNumber already registered"
        );
        require(initialOwner != address(0), "RepairChain: invalid owner address");

        products[productId] = Product({
            productId:      productId,
            serialNumber:   serialNumber,
            owner:          initialOwner,
            exists:         true,
            transferPending: false,
            pendingNewOwner: address(0),
            registeredAt:   block.timestamp
        });

        serialToProductId[serialNumber] = productId;
        allProductIds.push(productId);

        emit ProductRegistered(productId, serialNumber, initialOwner, block.timestamp);
    }

    /**
     * @notice Authorize a service center address to record lifecycle events.
     */
    function addAuthorizedServiceCenter(address serviceCenterAddress) external onlyAdmin {
        require(serviceCenterAddress != address(0), "RepairChain: zero address");
        require(!authorizedServiceCenters[serviceCenterAddress], "RepairChain: already authorized");
        authorizedServiceCenters[serviceCenterAddress] = true;
        emit ServiceCenterAuthorized(serviceCenterAddress, block.timestamp);
    }

    /**
     * @notice Revoke a service center's authorization.
     */
    function removeAuthorizedServiceCenter(address serviceCenterAddress) external onlyAdmin {
        require(authorizedServiceCenters[serviceCenterAddress], "RepairChain: not authorized");
        authorizedServiceCenters[serviceCenterAddress] = false;
        emit ServiceCenterDeactivated(serviceCenterAddress, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Service Center Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Record a lifecycle event proof on-chain.
     *         The eventHash is keccak256 of the canonical off-chain event data.
     * @param productId  Product this event belongs to
     * @param eventHash  keccak256 hash of the canonical event JSON from MongoDB
     * @param eventType  Human-readable event type (e.g. "REPAIR", "INSPECTION")
     */
    function recordLifecycleEvent(
        string  memory productId,
        bytes32        eventHash,
        string  memory eventType
    )
        external
        onlyAuthorizedServiceCenter
        productExists(productId)
    {
        require(eventHash != bytes32(0), "RepairChain: empty event hash");
        require(bytes(eventType).length > 0, "RepairChain: empty event type");

        uint256 eventIndex = lifecycleEvents[productId].length;

        lifecycleEvents[productId].push(LifecycleEvent({
            eventHash: eventHash,
            submitter: msg.sender,
            timestamp: block.timestamp,
            eventType: eventType
        }));

        emit LifecycleEventRecorded(
            productId,
            eventHash,
            eventType,
            msg.sender,
            eventIndex,
            block.timestamp
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Ownership Transfer Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Initiate an ownership transfer. Called by the current owner.
     *         Backend signs this on behalf of the registered owner address.
     */
    function initiateOwnershipTransfer(
        string  memory productId,
        address        newOwner
    )
        external
        productExists(productId)
        onlyProductOwner(productId)
    {
        require(newOwner != address(0),               "RepairChain: invalid new owner");
        require(newOwner != msg.sender,               "RepairChain: cannot transfer to self");
        require(!products[productId].transferPending, "RepairChain: transfer already pending");

        products[productId].transferPending  = true;
        products[productId].pendingNewOwner  = newOwner;

        emit OwnershipTransferInitiated(productId, msg.sender, newOwner, block.timestamp);
    }

    /**
     * @notice Accept a pending ownership transfer. Called by the new owner.
     */
    function acceptOwnershipTransfer(string memory productId)
        external
        productExists(productId)
    {
        Product storage p = products[productId];
        require(p.transferPending,            "RepairChain: no pending transfer");
        require(p.pendingNewOwner == msg.sender, "RepairChain: caller is not the pending owner");

        address previousOwner = p.owner;
        p.owner              = msg.sender;
        p.transferPending    = false;
        p.pendingNewOwner    = address(0);

        emit OwnershipTransferAccepted(productId, msg.sender, block.timestamp);
        // Suppress unused variable warning
        previousOwner;
    }

    /**
     * @notice Cancel a pending ownership transfer. Called by the current owner.
     */
    function cancelOwnershipTransfer(string memory productId)
        external
        productExists(productId)
        onlyProductOwner(productId)
    {
        require(products[productId].transferPending, "RepairChain: no pending transfer");
        products[productId].transferPending  = false;
        products[productId].pendingNewOwner  = address(0);
        emit OwnershipTransferCancelled(productId, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View / Pure Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns basic product info (public, no personal data).
     */
    function getProduct(string memory productId)
        external
        view
        productExists(productId)
        returns (
            string  memory pid,
            string  memory serialNumber,
            address        owner,
            bool           transferPending,
            address        pendingNewOwner,
            uint256        registeredAt,
            uint256        eventCount
        )
    {
        Product storage p = products[productId];
        return (
            p.productId,
            p.serialNumber,
            p.owner,
            p.transferPending,
            p.pendingNewOwner,
            p.registeredAt,
            lifecycleEvents[productId].length
        );
    }

    /**
     * @notice Returns a single lifecycle event by index.
     */
    function getLifecycleEvent(string memory productId, uint256 index)
        external
        view
        productExists(productId)
        returns (
            bytes32 eventHash,
            address submitter,
            uint256 timestamp,
            string  memory eventType
        )
    {
        require(index < lifecycleEvents[productId].length, "RepairChain: index out of range");
        LifecycleEvent storage e = lifecycleEvents[productId][index];
        return (e.eventHash, e.submitter, e.timestamp, e.eventType);
    }

    /**
     * @notice Verify that a given hash matches the stored hash for a specific event.
     *         Used by the frontend to independently prove data integrity.
     */
    function verifyEventHash(
        string  memory productId,
        uint256        index,
        bytes32        hash
    ) external view productExists(productId) returns (bool) {
        require(index < lifecycleEvents[productId].length, "RepairChain: index out of range");
        return lifecycleEvents[productId][index].eventHash == hash;
    }

    /**
     * @notice Get the product ID associated with a serial number.
     */
    function getProductIdBySerial(string memory serialNumber)
        external
        view
        returns (string memory)
    {
        return serialToProductId[serialNumber];
    }

    /**
     * @notice Returns the total number of registered products.
     */
    function getProductCount() external view returns (uint256) {
        return allProductIds.length;
    }

    /**
     * @notice Returns the total number of lifecycle events for a product.
     */
    function getLifecycleEventCount(string memory productId)
        external
        view
        productExists(productId)
        returns (uint256)
    {
        return lifecycleEvents[productId].length;
    }

    /**
     * @notice Check if a product with a given ID exists.
     */
    function productIdExists(string memory productId) external view returns (bool) {
        return products[productId].exists;
    }
}
