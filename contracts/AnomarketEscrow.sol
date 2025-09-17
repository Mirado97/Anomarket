// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ВНИМАНИЕ: Эта версия предназначена только для тестирования,
// так как функция executeCrossChainSale не защищена.

contract AnomarketEscrow is Ownable, ERC1155Holder {
    
    struct Listing {
        address seller;
        address nftContractAddress;
        uint256 tokenId;
        uint256 price;
        bool active;
        mapping(uint256 => bool) allowedPaymentChains;
    }

    uint256 public nextListingId;
    mapping(uint256 => Listing) public listings;

    event NftListed(uint256 indexed listingId, address indexed seller, address nftContractAddress, uint256 tokenId, uint256 price);
    event NftSold(uint256 indexed listingId, address buyer);
    event ListingCancelled(uint256 indexed listingId);

    constructor() Ownable(msg.sender) {}

    function listNft(address _nftContractAddress, uint256 _tokenId, uint256 _price, uint256[] calldata _paymentChainIds) external {
        require(_price > 0, "Price must be greater than zero");
        require(_paymentChainIds.length > 0, "Must allow at least one payment chain");
        
        IERC1155 nftContract = IERC1155(_nftContractAddress);
        nftContract.safeTransferFrom(msg.sender, address(this), _tokenId, 1, "");

        uint256 listingId = nextListingId;
        Listing storage newListing = listings[listingId];

        newListing.seller = msg.sender;
        newListing.nftContractAddress = _nftContractAddress;
        newListing.tokenId = _tokenId;
        newListing.price = _price;
        newListing.active = true;
        
        for(uint i = 0; i < _paymentChainIds.length; i++) {
            newListing.allowedPaymentChains[_paymentChainIds[i]] = true;
        }
        
        nextListingId++;

        emit NftListed(listingId, msg.sender, _nftContractAddress, _tokenId, _price);
    }

    function isPaymentChainAllowed(uint256 _listingId, uint256 _chainId) external view returns (bool) {
        return listings[_listingId].allowedPaymentChains[_chainId];
    }

    // ИЗМЕНЕНИЕ: Модификатор `onlyOwner` удален для тестов
    function executeCrossChainSale(uint256 _listingId, address _buyer) external {
        Listing storage listing = listings[_listingId];
        require(listing.active, "Listing is not active");
        listing.active = false;
        IERC1155 nftContract = IERC1155(listing.nftContractAddress);
        nftContract.safeTransferFrom(address(this), _buyer, listing.tokenId, 1, "");
        emit NftSold(_listingId, _buyer);
    }

    function cancelListing(uint256 _listingId) external {
        Listing storage listing = listings[_listingId];
        require(listing.active, "Listing is not active");
        require(msg.sender == listing.seller, "Only the seller can cancel");
        listing.active = false;
        IERC1155 nftContract = IERC1155(listing.nftContractAddress);
        nftContract.safeTransferFrom(address(this), listing.seller, listing.tokenId, 1, "");
        emit ListingCancelled(_listingId);
    }
}