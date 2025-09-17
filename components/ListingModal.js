// components/ListingModal.js
import { useState } from 'react';

const ETH_SEPOLIA_CHAIN_ID = 11155111;
const BASE_SEPOLIA_CHAIN_ID = 84532;
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

const supportedChains = [
    { id: ETH_SEPOLIA_CHAIN_ID, name: "Ethereum Sepolia" },
    { id: BASE_SEPOLIA_CHAIN_ID, name: "Base Sepolia" },
    { id: ARBITRUM_SEPOLIA_CHAIN_ID, name: "Arbitrum Sepolia" },
];

export default function ListingModal({ nft, isOpen, onClose, onList }) {
    if (!isOpen || !nft) return null;

    const [price, setPrice] = useState("");
    const [selectedChains, setSelectedChains] = useState({ [ETH_SEPOLIA_CHAIN_ID]: true, [BASE_SEPOLIA_CHAIN_ID]: true, [ARBITRUM_SEPOLIA_CHAIN_ID]: true });
    const [isChainsOpen, setIsChainsOpen] = useState(false);

    const handleChainSelection = (chainId) => {
        setSelectedChains(prev => ({ ...prev, [chainId]: !prev[chainId] }));
    };

    const handleListClick = () => {
        const paymentChainIds = Object.entries(selectedChains).filter(([, isSelected]) => isSelected).map(([id]) => parseInt(id));
        if (!price || parseFloat(price) <= 0) {
            alert("Please enter a price greater than zero.");
            return;
        }
        if (paymentChainIds.length === 0) {
            alert("Please select at least one network to accept payment on.");
            return;
        }
        onList(nft, price, paymentChainIds);
    };

    return (
        <div style={styles.backdrop} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button style={styles.closeButton} onClick={onClose}>&times;</button>
                <div style={styles.modalContent}>
                    <div style={styles.leftPanel}>
                        <img src={nft.image?.cachedUrl || '/placeholder.png'} alt={nft.name} style={styles.nftImage} />
                    </div>
                    <div style={styles.rightPanel}>
                        <h2 style={styles.nftTitle}>{nft.name || `#${nft.tokenId}`}</h2>
                        
                        <div style={styles.spoiler}>
                            <button style={styles.spoilerButton} onClick={() => setIsChainsOpen(!isChainsOpen)}>
                                <span>Payment Blockchains</span>
                                <span>{isChainsOpen ? '−' : '+'}</span>
                            </button>
                            {isChainsOpen && (
                                <div style={styles.checkboxContainer}>
                                    {supportedChains.map(chain => (
                                        <label key={chain.id} style={styles.label}>
                                            <input type="checkbox" checked={!!selectedChains[chain.id]} onChange={() => handleChainSelection(chain.id)} />
                                            {chain.name}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div style={styles.priceInputContainer}>
                            <label style={styles.inputLabel}>Price</label>
                            <div style={styles.inputWrapper}>
                                <input
                                    type="text"
                                    placeholder="0.05"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    style={styles.input}
                                />
                                <span style={styles.ethLabel}>ETH</span>
                            </div>
                        </div>
                        <p style={styles.feeInfo}>Service Fee 1%</p>

                        <button style={styles.sellButton} onClick={handleListClick}>Intent List Item</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Стили для модального окна
const styles = {
    backdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: '#1a1a1e', borderRadius: '12px', width: '90%', maxWidth: '700px', position: 'relative', border: '1px solid #333' },
    closeButton: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#888', fontSize: '2em', cursor: 'pointer' },
    modalContent: { display: 'flex', padding: '30px' },
    leftPanel: { flex: '1 1 40%', marginRight: '30px' },
    nftImage: { width: '100%', borderRadius: '12px' },
    rightPanel: { flex: '1 1 60%', display: 'flex', flexDirection: 'column' },
    nftTitle: { margin: '0 0 20px 0'},
    spoiler: { border: '1px solid #333', borderRadius: '8px', marginBottom: '20px' },
    spoilerButton: { width: '100%', background: 'none', border: 'none', color: '#fff', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '1em' },
    checkboxContainer: { padding: '0 15px 15px 15px' },
    label: { display: 'block', margin: '10px 0', cursor: 'pointer' },
    priceInputContainer: { marginBottom: '10px' },
    inputLabel: { display: 'block', marginBottom: '5px', color: '#888', textAlign: 'left' },
    inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    input: { width: '100%', backgroundColor: '#202026', border: '1px solid #333', borderRadius: '8px', color: '#fff', padding: '15px', fontSize: '1.2em', boxSizing: 'border-box' },
    ethLabel: { position: 'absolute', right: '15px', color: '#888' },
    feeInfo: { color: '#888', fontSize: '0.9em', margin: '0 0 20px 0', textAlign: 'left' },
    sellButton: { width: '100%', padding: '15px', backgroundColor: '#007bff', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1.2em', fontWeight: 'bold', cursor: 'pointer', marginTop: 'auto' },
};