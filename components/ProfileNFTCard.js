// components/ProfileNFTCard.js

export default function ProfileNFTCard({ nft, onClick }) {
    return (
        <div style={styles.nftCard} onClick={onClick}>
            <img src={nft.image?.cachedUrl || '/placeholder.png'} alt={nft.name} style={styles.nftImage} />
            <div style={styles.cardInfo}>
                <h4 style={styles.nftTitle}>{nft.name}</h4>
                <p style={styles.nftTokenId}>#{nft.tokenId}</p>
            </div>
        </div>
    );
}

const styles = {
    nftCard: { backgroundColor: '#2a2a2e', borderRadius: '12px', border: '1px solid #333', cursor: 'pointer', transition: 'transform 0.2s' },
    nftImage: { width: '100%', height: '180px', objectFit: 'cover', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' },
    cardInfo: { padding: '15px' },
    nftTitle: { margin: '0 0 5px 0', fontSize: '1em', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    nftTokenId: { margin: '0', color: '#888', fontSize: '0.9em' },
};