import { useState, useEffect } from "react";
import { useAccount, useConfig, useSwitchChain, useWriteContract, useSendTransaction } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { useModal } from "connectkit";
import Header from "../components/Header";
import NFTCard, { NFTCardSkeleton } from "../components/NFTCard";
import Sidebar from "../components/Sidebar";
import EscrowABI from "../abi/AnomarketEscrow.json";
import { ethers } from "ethers";

const ETH_SEPOLIA_CHAIN_ID = 11155111;
const BASE_SEPOLIA_CHAIN_ID = 84532;
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
const escrowContracts = { [ETH_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ETHEREUM, [BASE_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_BASE, [ARBITRUM_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ARBITRUM, };
const rpcProviders = { [ETH_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL, [BASE_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL, [ARBITRUM_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL, };
const alchemyUrls = { [ETH_SEPOLIA_CHAIN_ID]: "https://eth-sepolia.g.alchemy.com/nft/v3/", [BASE_SEPOLIA_CHAIN_ID]: "https://base-sepolia.g.alchemy.com/nft/v3/", [ARBITRUM_SEPOLIA_CHAIN_ID]: "https://arb-sepolia.g.alchemy.com/nft/v3/", };
const supportedChains = [ { id: ETH_SEPOLIA_CHAIN_ID, name: "Ethereum Sepolia" }, { id: BASE_SEPOLIA_CHAIN_ID, name: "Base Sepolia" }, { id: ARBITRUM_SEPOLIA_CHAIN_ID, name: "Arbitrum Sepolia" } ];

export default function Home() {
    const { address, isConnected, chain, chainId } = useAccount();
    const { chains, switchChain } = useSwitchChain();
    const { writeContractAsync } = useWriteContract();
    const { setOpen } = useModal();
    const config = useConfig();
    const { sendTransactionAsync } = useSendTransaction();

    const [isMounted, setIsMounted] = useState(false);
    const [listedNfts, setListedNfts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState('');
    const [chainFilters, setChainFilters] = useState({ [ETH_SEPOLIA_CHAIN_ID]: true, [BASE_SEPOLIA_CHAIN_ID]: true, [ARBITRUM_SEPOLIA_CHAIN_ID]: true });
    const [paymentChainFilters, setPaymentChainFilters] = useState({ [ETH_SEPOLIA_CHAIN_ID]: true, [BASE_SEPOLIA_CHAIN_ID]: true, [ARBITRUM_SEPOLIA_CHAIN_ID]: true });

    useEffect(() => { setIsMounted(true); }, []);

    async function fetchListedNfts() {
        setIsLoading(true);
        setStatus("Loading items from all marketplaces...");
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
                    if (listing.active) {
                        const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
                        const url = `${alchemyUrls[chainIdNum]}${apiKey}/getNFTMetadata?contractAddress=${listing.nftContractAddress}&tokenId=${listing.tokenId}`;
                        const metaResponse = await fetch(url);
                        if (!metaResponse.ok) continue;
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
            const allListings = results.flat();
            setListedNfts(allListings);
        } catch (error) {
            console.error("Error fetching listings:", error);
            setStatus("Could not load items.");
        }
        setIsLoading(false);
        setStatus("");
    }

    useEffect(() => {
        fetchListedNfts();
    }, []);

    const handleChainFilterChange = (chainId, isChecked) => {
        setChainFilters(prev => ({ ...prev, [chainId]: isChecked }));
    };

    const handlePaymentChainFilterChange = (chainId, isChecked) => {
        setPaymentChainFilters(prev => ({ ...prev, [chainId]: isChecked }));
    };

    const filteredNfts = listedNfts.filter(nft => {
        if (searchQuery && !nft.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        const activeChainFilters = Object.entries(chainFilters).filter(([, isChecked]) => isChecked).map(([id]) => parseInt(id));
        if (activeChainFilters.length > 0 && !activeChainFilters.includes(nft.originChainId)) return false;
        const activePaymentFilters = Object.entries(paymentChainFilters).filter(([, isChecked]) => isChecked).map(([id]) => parseInt(id));
        if (activePaymentFilters.length > 0) {
            const hasAllowedPaymentMethod = nft.allowedChains.some(allowedChain => activePaymentFilters.includes(allowedChain.id));
            if (!hasAllowedPaymentMethod) return false;
        }
        return true;
    });

    async function handleBuyNft(listing) {
        if (!isConnected) { setOpen(true); return; }
        setStatus(`Initiating cross-chain purchase...`);
        try {
            setStatus(`Please confirm payment of ${ethers.formatEther(listing.price)} ETH in ${chain.name}...`);
            const paymentTxHash = await sendTransactionAsync({ to: listing.seller, value: listing.price });
            setStatus("Payment sent! Verifying transaction on the backend...");
            const response = await fetch('/api/execute-sale', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId: listing.listingId, buyerAddress: address, paymentTxHash: paymentTxHash, paymentChainId: chainId, originChainId: listing.originChainId }), });
            const data = await response.json();
            if (data.success) {
                setStatus(`Congratulations! The NFT is yours!`);
            } else {
                throw new Error(data.error || "Unknown backend error.");
            }
            setTimeout(() => {
                fetchListedNfts();
            }, 2000);
        } catch (error) {
            console.error("Error during purchase:", error);
            setStatus("Error during purchase: " + error.message);
        }
    }

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
            setTimeout(() => {
                fetchListedNfts();
            }, 2000);
        } catch (error) {
            console.error("Error cancelling listing:", error);
            setStatus("Error during cancellation: " + error.message);
        }
    }
    
    if (!isMounted) {
        return null;
    }

    return (
        <div>
            <section style={styles.hero}>
                <h1 style={styles.heroTitle}>Explore, Collect, and Sell NFTs</h1>
                <p style={styles.heroSubtitle}>Anomarket is an Intent-Based Cross-Chain NFT Marketplace</p>
            </section>
            
            <div style={styles.mainContainer}>
                <Sidebar 
                    onSearchChange={setSearchQuery}
                    onChainChange={handleChainFilterChange}
                    onPaymentChainChange={handlePaymentChainFilterChange}
                />
                <div style={styles.mainContent}>
                    <div style={styles.nftGrid}>
                        {isLoading ? (
                            Array.from({ length: 12 }).map((_, index) => <NFTCardSkeleton key={index} />)
                        ) : filteredNfts.length > 0 ? (
                            filteredNfts.map(nft => (
                                <NFTCard 
                                    key={`${nft.originChainId}-${nft.listingId}`}
                                    nft={nft}
                                    isOwner={address && nft.seller.toLowerCase() === address.toLowerCase()}
                                    onBuy={() => handleBuyNft(nft)}
                                    onCancel={() => handleCancelListing(nft)}
                                />
                            ))
                        ) : (
                            <p style={{marginLeft: '20px'}}>No items found with the selected filters.</p>
                        )}
                    </div>
                </div>
            </div>
            {status && <footer style={styles.footer}>{status}</footer>}
        </div>
    );
}

const styles = {
    hero: { textAlign: 'center', padding: '40px 20px' },
    heroTitle: { fontSize: '2.5em', fontWeight: 'bold', color: '#fff', letterSpacing: '-1px', margin: '0 0 10px 0' },
    heroSubtitle: { fontSize: '1.1em', color: '#999' },
    mainContainer: { display: 'flex', gap: '30px' },
    mainContent: { flex: 1 },
    nftGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' },
    footer: { position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: '#007bff', color: 'white', padding: '10px', textAlign: 'center', zIndex: 1000 },
};