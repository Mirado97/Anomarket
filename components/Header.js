// components/Header.js
import { useAccount, useBalance, useSwitchChain } from 'wagmi';
import { ConnectKitButton } from "connectkit";
import Link from 'next/link';

const UserIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/></svg> );

export default function Header() {
    const { isConnected, chain } = useAccount();
    const { chains, switchChain } = useSwitchChain();
    const { data: balanceData } = useBalance({ address: useAccount().address });

    return (
        <header style={styles.header}>
            <Link href="/" style={{textDecoration: 'none'}}>
                <span style={styles.logoLink}>Anomarket</span>
            </Link>
            
            <div style={styles.searchBar}>
                <input type="text" placeholder="Search items, collections, and accounts" style={styles.searchInput} />
            </div>

            <div style={styles.navIcons}>
                {isConnected && (
                    <div style={styles.networkInfo}>
                        <div style={styles.balance}>
                            {balanceData ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}` : '...'}
                        </div>
                        <select
                            value={chain?.id}
                            onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
                            style={styles.networkSwitcher}
                        >
                            {chains.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <ConnectKitButton />
                {isConnected && (
                     <Link href="/profile" legacyBehavior>
                        <a style={styles.profileIconLink}>
                            <UserIcon />
                        </a>
                    </Link>
                )}
            </div>
        </header>
    );
}

const styles = {
    header: { display: 'flex', alignItems: 'center', padding: '15px 30px', borderBottom: '1px solid #262626', backgroundColor: '#121218' },
    logoLink: { color: '#ff4136', textDecoration: 'none', fontSize: '1.8em', fontWeight: 'bold', marginRight: '40px', cursor: 'pointer'},
    searchBar: { flex: 1, display: 'flex' },
    searchInput: { width: '100%', maxWidth: '700px', backgroundColor: '#202026', border: '1px solid #333', borderRadius: '10px', color: '#fff', padding: '12px 20px', fontSize: '1em', outline: 'none' },
    navIcons: { display: 'flex', alignItems: 'center', gap: '15px' },
    profileIconLink: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: '#262626', borderRadius: '50%', cursor: 'pointer', transition: 'background-color 0.2s', },
    networkInfo: { display: 'flex', alignItems: 'center', gap: '15px', color: '#fff', backgroundColor: '#202026', padding: '8px 12px', borderRadius: '10px', },
    balance: { fontFamily: 'monospace', fontSize: '0.9em' },
    networkSwitcher: { backgroundColor: '#333', color: '#fff', border: '1px solid #444', borderRadius: '5px', padding: '5px', cursor: 'pointer' },
};