// components/NFTCard.js
import { useState, useEffect } from 'react'; // Добавляем useEffect
import { ethers } from 'ethers';

// --- КОНСТАНТЫ ID СЕТЕЙ ---
const ETH_SEPOLIA_CHAIN_ID = 11155111;
const BASE_SEPOLIA_CHAIN_ID = 84532;
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

// --- Компонент для иконок сетей ---
const ChainIcon = ({ chainId }) => {
    const ethIcon = ( <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"> <path d="M12 1.75L11.64 2.45L6.27 11.24L12 14.33L17.73 11.24L12.36 2.45L12 1.75ZM12 15.84L6.27 12.75L12 22.25L17.73 12.75L12 15.84Z" /> </svg> );
    const baseIcon = ( <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="2" fill="#0052ff"/> </svg> );
    const arbIcon = ( <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M15.42 12.44L10 5.25L4.58 12.44L10 19.62L15.42 12.44Z" fill="#28a0f0"/> <path d="M10 5.25L4.58 12.44L10 15.75L15.42 12.44L10 5.25Z" fill="#2165de"/> <path d="M10 4.12L15.42 11.31L10 0.37L4.58 11.31L10 4.12Z" fill="#28a0f0"/> <path d="M4.58 11.31L10 4.12L10 8.05L4.58 11.31Z" fill="#2165de"/> </svg> );

    switch (chainId) {
        case ETH_SEPOLIA_CHAIN_ID: return ethIcon;
        case BASE_SEPOLIA_CHAIN_ID: return baseIcon;
        case ARBITRUM_SEPOLIA_CHAIN_ID: return arbIcon;
        default: return null;
    }
};

const skeleton = ` @keyframes skeleton-loading { 0% { background-color: hsl(200, 20%, 25%); } 100% { background-color: hsl(200, 20%, 35%); } }`;
export const NFTCardSkeleton = () => ( <div style={styles.nftCard}> <style>{skeleton}</style> <div style={{...styles.skeleton, ...styles.skeletonImage}}></div> <div style={{...styles.skeleton, ...styles.skeletonText}}></div> <div style={{...styles.skeleton, ...styles.skeletonPrice}}></div> <div style={{...styles.skeleton, ...styles.skeletonButton}}></div> </div> );

export default function NFTCard({ nft, onBuy, onCancel, isOwner }) {
    const [isHovered, setIsHovered] = useState(false);
    const maxIcons = 3;
    const chainsToShow = nft.allowedChains?.slice(0, maxIcons) || [];
    const remainingChains = nft.allowedChains?.length > maxIcons ? nft.allowedChains.length - maxIcons : 0;

    // ИСПРАВЛЕНИЕ: Переносим код, работающий с 'document', внутрь useEffect
    useEffect(() => {
        const hoverStyle = document.createElement('style');
        hoverStyle.innerHTML = `
            .nft-card:hover .action-button {
                opacity: 1 !important;
            }
        `;
        document.head.appendChild(hoverStyle);

        // Очищаем стили при размонтировании компонента
        return () => {
            document.head.removeChild(hoverStyle);
        };
    }, []); // Пустой массив зависимостей означает, что код выполнится один раз на клиенте

    return (
        <div 
            style={isHovered ? {...styles.nftCard, ...styles.nftCardHover} : styles.nftCard}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="nft-card" // Добавляем класс для CSS-селектора
        >
            <div style={styles.imageContainer}>
                <img src={nft.image || '/placeholder.png'} alt={nft.name} style={styles.nftImage} />
                {isHovered && (
                     isOwner ? (
                        <button onClick={onCancel} style={{...styles.actionButton, ...styles.cancelButton}} className="action-button">
                            Cancel Listing
                        </button>
                    ) : (
                        <button onClick={onBuy} style={{...styles.actionButton, ...styles.buyButton}} className="action-button">
                            Buy Now
                        </button>
                    )
                )}
            </div>
            <div style={styles.cardInfo}>
                <h4 style={styles.nftTitle}>{nft.name || `#${nft.tokenId}`}</h4>
                <div style={styles.priceContainer}>
                    <span style={styles.price}>{ethers.formatEther(nft.price)}</span>
                    <span style={styles.currency}>ETH</span>
                </div>
                <div style={styles.chainsContainer}>
                    {chainsToShow.map(chain => (
                        <div key={chain.id} style={styles.chainIconWrapper}>
                           <ChainIcon chainId={chain.id} />
                        </div>
                    ))}
                    {remainingChains > 0 && (
                        <div style={{...styles.chainIconWrapper, ...styles.plusN}}>
                            +{remainingChains}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    nftCard: { backgroundColor: '#1a1a1e', borderRadius: '12px', border: '1px solid #262626', overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
    nftCardHover: { transform: 'translateY(-5px)', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)' },
    imageContainer: { position: 'relative' },
    nftImage: { width: '100%', height: '220px', objectFit: 'cover', display: 'block' },
    actionButton: { position: 'absolute', bottom: '10px', left: '10px', right: '10px', padding: '12px', borderRadius: '8px', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold', opacity: 0, transition: 'opacity 0.2s ease' },
    buyButton: { backgroundColor: '#007bff' },
    cancelButton: { backgroundColor: '#dc3545' },
    cardInfo: { padding: '15px' },
    nftTitle: { margin: '0 0 5px 0', fontSize: '1em', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' },
    priceContainer: { display: 'flex', alignItems: 'baseline', gap: '5px', textAlign: 'left' },
    price: { fontSize: '1.1em', fontWeight: 'bold', color: '#fff' },
    currency: { fontSize: '0.9em', color: '#888' },
    chainsContainer: { display: 'flex', gap: '5px', marginTop: '10px' },
    chainIconWrapper: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    plusN: { fontSize: '10px', fontWeight: 'bold' },
    skeleton: { animation: 'skeleton-loading 1s linear infinite alternate', borderRadius: '8px' },
    skeletonImage: { width: '100%', height: '220px', marginBottom: '15px' },
    skeletonText: { width: '70%', height: '20px', margin: '5px auto' },
    skeletonPrice: { width: '40%', height: '24px', margin: '10px auto' },
    skeletonButton: { width: '100%', height: '45px', marginTop: '25px' },
};