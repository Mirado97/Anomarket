// pages/profile/index.js
import { useState, useEffect } from "react";
import { useAccount, useConfig, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { ethers } from "ethers";
import { useRouter } from 'next/router';
import ProfileLayout from '../../components/ProfileLayout';
import Sidebar from '../../components/Sidebar';
import ListingModal from "../../components/ListingModal";
import ProfileNFTCard from "../../components/ProfileNFTCard";

// КОНСТАНТЫ
const NFT_ABI = [ { "inputs": [ { "internalType": "address", "name": "operator", "type": "address" }, { "internalType": "bool", "name": "approved", "type": "bool" } ], "name": "setApprovalForAll", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ];
const EscrowABI = require("../../abi/AnomarketEscrow.json");
const ETH_SEPOLIA_CHAIN_ID = 11155111;
const BASE_SEPOLIA_CHAIN_ID = 84532;
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
const escrowContracts = { [ETH_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ETHEREUM, [BASE_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_BASE, [ARBITRUM_SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ARBITRUM, };
const alchemyUrls = { [ETH_SEPOLIA_CHAIN_ID]: "https://eth-sepolia.g.alchemy.com/nft/v3/", [BASE_SEPOLIA_CHAIN_ID]: "https://base-sepolia.g.alchemy.com/nft/v3/", [ARBITRUM_SEPOLIA_CHAIN_ID]: "https://arb-sepolia.g.alchemy.com/nft/v3/", };

export default function CollectedPage() {
    const { address, isConnected } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const config = useConfig();
    const router = useRouter();

    const [isMounted, setIsMounted] = useState(false);
    const [allUserNfts, setAllUserNfts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedNft, setSelectedNft] = useState(null);

    // Состояния для фильтров
    const [searchQuery, setSearchQuery] = useState('');
    const [chainFilters, setChainFilters] = useState({ [ETH_SEPOLIA_CHAIN_ID]: true, [BASE_SEPOLIA_CHAIN_ID]: true, [ARBITRUM_SEPOLIA_CHAIN_ID]: true });

    useEffect(() => { setIsMounted(true); }, []);

    async function fetchAllUserNfts() {
        if (!address) return;
        setIsLoading(true);
        setStatus("Loading NFTs from all networks...");
        const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
        const allNfts = [];
        const fetchPromises = Object.keys(alchemyUrls).map(async (chainId) => {
            const url = `${alchemyUrls[chainId]}${apiKey}/getNFTsForOwner?owner=${address}&withMetadata=true&pageSize=100`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                return data.ownedNfts?.map(nft => ({...nft, originChainId: parseInt(chainId)})) || [];
            } catch (error) { console.error(`Error fetching NFTs from chain ${chainId}:`, error); return []; }
        });
        const results = await Promise.all(fetchPromises);
        setAllUserNfts(results.flat());
        setIsLoading(false);
        setStatus("");
    }

    useEffect(() => { if (isConnected) { fetchAllUserNfts(); } }, [isConnected, address]);
    
    const handleChainFilterChange = (chainId, isChecked) => {
        setChainFilters(prev => ({ ...prev, [chainId]: isChecked }));
    };

    const filteredNfts = allUserNfts.filter(nft => {
        if (searchQuery && !nft.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        const activeChainFilters = Object.entries(chainFilters).filter(([, isChecked]) => isChecked).map(([id]) => parseInt(id));
        if (activeChainFilters.length > 0 && !activeChainFilters.includes(nft.originChainId)) return false;
        return true;
    });

    const handleOpenModal = (nft) => { setSelectedNft(nft); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedNft(null); };

    async function handleListNft(nft, price, paymentChainIds) {
        const currentEscrowAddress = escrowContracts[nft.originChainId];
        if (!currentEscrowAddress) { alert("Listing from this network is not supported."); return; }
        const priceInWei = ethers.parseEther(price);
        try {
            setIsModalOpen(false);
            setStatus(`1/2: Approving contract...`);
            const approveTxHash = await writeContractAsync({ abi: NFT_ABI, address: nft.contract.address, functionName: 'setApprovalForAll', args: [currentEscrowAddress, true] });
            setStatus(`1/2: Waiting for approval confirmation...`);
            await waitForTransactionReceipt(config, { hash: approveTxHash });
            setStatus(`2/2: Confirm listing in your wallet...`);
            await writeContractAsync({ abi: EscrowABI, address: currentEscrowAddress, functionName: 'listNft', args: [nft.contract.address, nft.tokenId, priceInWei, paymentChainIds] });
            setStatus(`NFT listed successfully! Redirecting...`);
            setTimeout(() => { router.push('/profile/listings'); }, 2000);
        } catch (error) { console.error("Error listing NFT:", error); setStatus("Error: " + error.message); }
    }

    if (!isMounted) { return null; }

    return (
        <>
            <ProfileLayout>
                {isConnected ? (
                    <div style={styles.profileContainer}>
                        <Sidebar 
                            onSearchChange={setSearchQuery}
                            onChainChange={handleChainFilterChange}
                            showStatusFilter={true} // Статус не нужен для кошелька
                        />
                        <div style={styles.mainContent}>
                            {isLoading ? ( <p>Loading your NFTs...</p> ) : filteredNfts.length > 0 ? (
                                <div style={styles.nftGrid}>
                                    {filteredNfts.map(nft => (
                                        <ProfileNFTCard
                                            key={`${nft.originChainId}-${nft.contract.address}-${nft.tokenId}`}
                                            nft={nft}
                                            onClick={() => handleOpenModal(nft)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div style={styles.centeredMessage}>
                                    <h3>No NFTs found with the selected filters.</h3>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={styles.centeredMessage}>
                        <h2>Please connect your wallet to see your profile.</h2>
                    </div>
                )}
            </ProfileLayout>
            <ListingModal nft={selectedNft} isOpen={isModalOpen} onClose={handleCloseModal} onList={handleListNft} />
            {status && <footer style={styles.footer}>{status}</footer>}
        </>
    );
}

const styles = {
    profileContainer: { display: 'flex', gap: '30px' },
    mainContent: { flex: 1 },
    nftGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' },
    centeredMessage: { textAlign: 'center', padding: '80px 20px', flex: 1 },
    footer: { position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: '#007bff', color: 'white', padding: '10px', textAlign: 'center', zIndex: 1000 },
};