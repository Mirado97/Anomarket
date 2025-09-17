// pages/profile/listings.js
import { useState, useEffect } from "react";
import { useAccount, useConfig, useSwitchChain, useWriteContract } from 'wagmi';
import ProfileLayout from '../../components/ProfileLayout';
import Sidebar from '../../components/Sidebar';
import NFTCard, { NFTCardSkeleton } from "../../components/NFTCard";
import EscrowABI from "../../abi/AnomarketEscrow.json";
import { ethers } from "ethers";

const ETH_SEPOLIA_CHAIN_ID = 11155111;
const BASE_SEPOLIA_CHAIN_ID = 84532;
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
const escrowContracts = { [ETH_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ETHEREUM, [BASE_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_BASE, [ARBITRUM_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ARBITRUM, };
const rpcProviders = { [ETH_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL, [BASE_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL, [ARBITRUM_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL, };
const alchemyUrls = { [ETH_SEPOLIA_CHAIN_ID]: "https://eth-sepolia.g.alchemy.com/nft/v3/", [BASE_SEPOLIA_CHAIN_ID]: "https://base-sepolia.g.alchemy.com/nft/v3/", [ARBITRUM_SEPOLIA_CHAIN_ID]: "https://arb-sepolia.g.alchemy.com/nft/v3/", };
const supportedChains = [ { id: ETH_SEPOLIA_CHAIN_ID, name: "Ethereum Sepolia" }, { id: BASE_SEPOLIA_CHAIN_ID, name: "Base Sepolia" }, { id: ARBITRUM_SEPOLIA_CHAIN_ID, name: "Arbitrum Sepolia" } ];

export default function ListingsPage() {
    const { address, isConnected, chainId } = useAccount();
    const { chains, switchChain } = useSwitchChain();
    const { writeContractAsync } = useWriteContract();

    const [isMounted, setIsMounted] = useState(false);
    const [myListedNfts, setMyListedNfts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState("");

    const [searchQuery, setSearchQuery] = useState('');
    const [chainFilters, setChainFilters] = useState({ [ETH_SEPOLIA_CHAIN_ID]: true, [BASE_SEPOLIA_CHAIN_ID]: true, [ARBITRUM_SEPOLIA_CHAIN_ID]: true });

    useEffect(() => { setIsMounted(true); }, []);

    async function fetchMyListedNfts() {
        if (!address) return;
        setIsLoading(true);
        setStatus("Loading your listings...");
        const allListings = [];
        try {
            const fetchPromises = Object.keys(escrowContracts).map(async (chainIdStr) => {
                const chainIdNum = parseInt(chainIdStr);
                const contractAddress = escrowContracts[chainIdNum];
                if (!contractAddress) return [];
                const provider = new ethers.JsonRpcProvider(rpcProviders[chainIdNum]);
                const contract = new ethers.Contract(contractAddress, EscrowABI, provider);
                const nextId = await contract.nextListingId();
                const listingsForChain = [];
                for (let i = 0; i < nextId; i++) {
                    const listing = await contract.listings(i);
                    if (listing.active && listing.seller.toLowerCase() === address.toLowerCase()) {
                        const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
                        const url = `${alchemyUrls[chainIdNum]}${apiKey}/getNFTMetadata?contractAddress=${listing.nftContractAddress}&tokenId=${listing.tokenId}`;
                        const metaResponse = await fetch(url);
                        const metaData = await metaResponse.json();
                        const allowedChainsPromises = supportedChains.map(chain => contract.isPaymentChainAllowed(i, chain.id));
                        const allowedChainsResults = await Promise.all(allowedChainsPromises);
                        const allowedChains = supportedChains.filter((chain, index) => allowedChainsResults[index]);
                        listingsForChain.push({ listingId: i, seller: listing.seller, nftContractAddress: listing.nftContractAddress, tokenId: listing.tokenId, price: listing.price, name: metaData.name, image: metaData.image?.cachedUrl, originChainId: chainIdNum, allowedChains: allowedChains });
                    }
                }
                return listingsForChain;
            });
            const results = await Promise.all(fetchPromises);
            setMyListedNfts(results.flat());
        } catch (error) {
            console.error("Error fetching listings:", error);
            setStatus("Could not load your listings.");
        }
        setIsLoading(false);
        setStatus("");
    }
    
    useEffect(() => { if (isConnected) { fetchMyListedNfts(); } }, [isConnected, address]);

    const handleChainFilterChange = (chainId, isChecked) => {
        setChainFilters(prev => ({ ...prev, [chainId]: isChecked }));
    };

    const filteredNfts = myListedNfts.filter(nft => {
        if (searchQuery && !nft.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        const activeChainFilters = Object.entries(chainFilters).filter(([, isChecked]) => isChecked).map(([id]) => parseInt(id));
        if (activeChainFilters.length > 0 && !activeChainFilters.includes(nft.originChainId)) return false;
        return true;
    });

    async function handleCancelListing(listing) {
        if (chainId !== listing.originChainId) {
            const originChain = chains.find(c => c.id === listing.originChainId);
            alert(`To cancel, please switch to the network where the NFT was listed (${originChain?.name}).`);
            switchChain({ chainId: listing.originChainId });
            return;
        }
        setStatus("Cancelling listing...");
        try {
            await writeContractAsync({ abi: EscrowABI, address: escrowContracts[listing.originChainId], functionName: 'cancelListing', args: [listing.listingId], });
            setStatus("Listing successfully cancelled!");
            setTimeout(() => { fetchMyListedNfts(); }, 2000);
        } catch (error) {
            console.error("Error cancelling listing:", error);
            setStatus("Error during cancellation: " + error.message);
        }
    }
    
    if (!isMounted) { return null; }

    return (
        <ProfileLayout>
            {isConnected ? (
                 <div style={styles.profileContainer}>
                    <Sidebar 
                        onSearchChange={setSearchQuery}
                        onChainChange={handleChainFilterChange}
                        showStatusFilter={true}
                    />
                    <div style={styles.mainContent}>
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, index) => <NFTCardSkeleton key={index} />)
                        ) : filteredNfts.length > 0 ? (
                            <div style={styles.nftGrid}>
                                {filteredNfts.map(nft => (
                                    <NFTCard 
                                        key={`${nft.originChainId}-${nft.listingId}`}
                                        nft={nft}
                                        isOwner={true}
                                        onCancel={() => handleCancelListing(nft)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div style={styles.centeredMessage}>
                                <h3>You have no active listings.</h3>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={styles.centeredMessage}>
                    <h2>Please connect your wallet.</h2>
                </div>
            )}
             {status && <footer style={styles.footer}>{status}</footer>}
        </ProfileLayout>
    );
}

const styles = {
    profileContainer: { display: 'flex', gap: '30px' },
    mainContent: { flex: 1 },
    nftGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' },
    centeredMessage: { textAlign: 'center', padding: '80px 20px', flex: 1 },
    footer: { position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: '#007bff', color: 'white', padding: '10px', textAlign: 'center', zIndex: 1000 },
};