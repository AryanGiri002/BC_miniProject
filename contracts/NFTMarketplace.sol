// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ERC721URIStorage, ReentrancyGuard, Ownable {
    // ─── Custom Errors ────────────────────────────────────────────────────────
    error AlreadyMinted(bytes32 fileHash);
    error AlreadyListed(uint256 tokenId);
    error NotOwner(uint256 tokenId, address caller);
    error PriceTooLow(uint256 required, uint256 sent);
    error SelfPurchase();
    error TransferFailed();
    error EmptyHash();
    error NotListed(uint256 tokenId);
    error OperationInProgress(uint256 tokenId);
    error InvalidPrice();
    error InvalidMessage();
    error AlreadyInscribed(uint256 tokenId, address author);

    // ─── Storage ──────────────────────────────────────────────────────────────
    struct MarketItem {
        address payable seller; // 20 bytes
        uint96 price;           // 12 bytes → fits with seller in 1 slot
        bool isListed;
        bytes32 fileHash;
    }

    uint256 private _tokenIdCounter;
    uint256 public immutable feeBasisPoints; // e.g. 25 = 2.5%
    uint256 public accumulatedFees;

    mapping(uint256 => MarketItem) public marketItems;
    mapping(bytes32 => bool) public hashExists;
    mapping(uint256 => bytes32) public tokenFileHash;
    mapping(uint256 => bool) private _tokenLocked;
    mapping(uint256 => mapping(address => bool)) public hasInscribed;

    // ─── Events ───────────────────────────────────────────────────────────────
    event NFTMinted(uint256 indexed tokenId, address indexed creator, bytes32 fileHash, string tokenURI);
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint96 price);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint96 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event OwnershipTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 timestamp);
    event InscriptionAdded(uint256 indexed tokenId, address indexed author, string message, uint256 timestamp);
    event FeesWithdrawn(address indexed recipient, uint256 amount);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier tokenNotLocked(uint256 tokenId) {
        if (_tokenLocked[tokenId]) revert OperationInProgress(tokenId);
        _tokenLocked[tokenId] = true;
        _;
        _tokenLocked[tokenId] = false;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(uint256 _feeBasisPoints) ERC721("NFTMarketplace", "NFTM") {
        feeBasisPoints = _feeBasisPoints;
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────
    function _nextTokenId() private returns (uint256) {
        unchecked { return ++_tokenIdCounter; }
    }

    // ─── Mint ─────────────────────────────────────────────────────────────────
    function mintNFT(string calldata tokenURI, bytes32 fileHash) external returns (uint256 tokenId) {
        if (fileHash == bytes32(0)) revert EmptyHash();
        if (bytes(tokenURI).length == 0) revert EmptyHash();
        if (hashExists[fileHash]) revert AlreadyMinted(fileHash);

        tokenId = _nextTokenId();
        hashExists[fileHash] = true;
        tokenFileHash[tokenId] = fileHash;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Initialise market item (not listed)
        marketItems[tokenId] = MarketItem({
            seller: payable(msg.sender),
            price: 0,
            isListed: false,
            fileHash: fileHash
        });

        emit NFTMinted(tokenId, msg.sender, fileHash, tokenURI);
        emit OwnershipTransferred(tokenId, address(0), msg.sender, block.timestamp);
    }

    // ─── List ─────────────────────────────────────────────────────────────────
    function listNFT(uint256 tokenId, uint96 price) external tokenNotLocked(tokenId) {
        if (price == 0) revert InvalidPrice();
        if (ownerOf(tokenId) != msg.sender) revert NotOwner(tokenId, msg.sender);

        MarketItem storage item = marketItems[tokenId];
        if (item.isListed) revert AlreadyListed(tokenId);

        // Transfer NFT custody to this contract
        _transfer(msg.sender, address(this), tokenId);

        item.seller = payable(msg.sender);
        item.price = price;
        item.isListed = true;

        emit NFTListed(tokenId, msg.sender, price);
    }

    // ─── Buy ──────────────────────────────────────────────────────────────────
    function buyNFT(uint256 tokenId) external payable nonReentrant tokenNotLocked(tokenId) {
        // 1. CHECKS
        MarketItem memory item = marketItems[tokenId]; // single SLOAD
        if (!item.isListed) revert NotListed(tokenId);
        if (msg.value < item.price) revert PriceTooLow(item.price, msg.value);
        if (msg.sender == item.seller) revert SelfPurchase();

        // 2. EFFECTS — update ALL state before any external call
        marketItems[tokenId].isListed = false;
        marketItems[tokenId].price = 0;

        uint256 fee = (uint256(item.price) * feeBasisPoints) / 1000;
        uint256 sellerProceeds = item.price - fee;
        accumulatedFees += fee;

        emit NFTSold(tokenId, item.seller, msg.sender, item.price);
        emit OwnershipTransferred(tokenId, item.seller, msg.sender, block.timestamp);

        // 3. INTERACT — NFT transfer, then ETH transfer
        _transfer(address(this), msg.sender, tokenId);

        (bool success, ) = item.seller.call{value: sellerProceeds}("");
        if (!success) revert TransferFailed();

        // Refund excess
        if (msg.value > item.price) {
            (bool refundOk, ) = payable(msg.sender).call{value: msg.value - item.price}("");
            if (!refundOk) revert TransferFailed();
        }
    }

    // ─── Cancel listing ───────────────────────────────────────────────────────
    function cancelListing(uint256 tokenId) external nonReentrant tokenNotLocked(tokenId) {
        MarketItem memory item = marketItems[tokenId];
        if (!item.isListed) revert NotListed(tokenId);
        if (item.seller != msg.sender) revert NotOwner(tokenId, msg.sender);

        marketItems[tokenId].isListed = false;
        marketItems[tokenId].price = 0;

        _transfer(address(this), msg.sender, tokenId);

        emit ListingCancelled(tokenId, msg.sender);
    }

    // ─── Legacy Inscriptions ──────────────────────────────────────────────────
    function addInscription(uint256 tokenId, string calldata message) external {
        if (ownerOf(tokenId) != msg.sender) revert NotOwner(tokenId, msg.sender);
        if (bytes(message).length == 0 || bytes(message).length > 280) revert InvalidMessage();
        if (hasInscribed[tokenId][msg.sender]) revert AlreadyInscribed(tokenId, msg.sender);

        hasInscribed[tokenId][msg.sender] = true;
        emit InscriptionAdded(tokenId, msg.sender, message, block.timestamp);
    }

    // ─── Fee withdrawal (pull pattern) ───────────────────────────────────────
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) revert TransferFailed();
        emit FeesWithdrawn(owner(), amount);
    }

    // ─── Views ────────────────────────────────────────────────────────────────
    function getTokenFileHash(uint256 tokenId) external view returns (bytes32) {
        return tokenFileHash[tokenId];
    }

    function getMarketItem(uint256 tokenId) external view returns (MarketItem memory) {
        return marketItems[tokenId];
    }

    function getTotalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
