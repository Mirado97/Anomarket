// components/Sidebar.js
import Spoiler from './Spoiler';

const supportedChains = [
    { id: 11155111, name: "Ethereum Sepolia" },
    { id: 84532, name: "Base Sepolia" },
    { id: 421614, name: "Arbitrum Sepolia" },
];

// Добавляем isProfilePage в параметры
export default function Sidebar({ onSearchChange, onChainChange, onPaymentChainChange, isProfilePage = false }) {
    return (
        <aside style={styles.sidebar}>
            <input
                type="text"
                placeholder="Search by name..."
                onChange={(e) => onSearchChange(e.target.value)}
                style={styles.searchInput}
            />
            <Spoiler title="NFT in Chain">
                <div style={styles.chainList}>
                    {supportedChains.map(chain => (
                        <label key={chain.id} style={styles.label}>
                            <input type="checkbox" onChange={(e) => onChainChange(chain.id, e.target.checked)} defaultChecked />
                            {chain.name}
                        </label>
                    ))}
                </div>
            </Spoiler>
            
            {/* Спойлер "Метод оплаты" будет показан ВЕЗДЕ, КРОМЕ страниц профиля */}
             {!isProfilePage && (
                <Spoiler title="Accepts Payment on">
                     <div style={styles.chainList}>
                        {supportedChains.map(chain => (
                            <label key={chain.id} style={styles.label}>
                                <input type="checkbox" onChange={(e) => onPaymentChainChange(chain.id, e.target.checked)} defaultChecked />
                                {chain.name}
                            </label>
                        ))}
                    </div>
                </Spoiler>
            )}
        </aside>
    );
}

const styles = {
    sidebar: { width: '300px', paddingTop: '10px' },
    searchInput: { width: '100%', backgroundColor: '#202026', border: '1px solid #333', borderRadius: '10px', color: '#fff', padding: '12px', fontSize: '1em', outline: 'none', boxSizing: 'border-box', marginBottom: '20px' },
    chainList: { display: 'flex', flexDirection: 'column', paddingTop: '10px' },
    label: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' },
};