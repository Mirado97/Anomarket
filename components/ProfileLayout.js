// components/ProfileLayout.js
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ProfileLayout({ children }) {
    const router = useRouter();

    const navItems = [
        { name: 'Collected', path: '/profile' },
        { name: 'Listings', path: '/profile/listings' },
        { name: 'Activity', path: '/profile/activity' },
    ];

    return (
        <div>
            <div style={styles.banner}></div>
            <div style={styles.avatarContainer}>
                <div style={styles.avatar}></div>
            </div>
            <div style={styles.mainContainer}>
                <nav style={styles.profileNav}>
                    {navItems.map(item => (
                        <Link key={item.name} href={item.path} style={{textDecoration: 'none'}}>
                           <span style={router.pathname === item.path ? styles.profileLinkActive : styles.profileLink}>
                                {item.name}
                           </span>
                        </Link>
                    ))}
                </nav>
                <div style={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}

const styles = {
    banner: { height: '200px', backgroundColor: '#2a2a2e', borderRadius: '12px' },
    avatarContainer: { display: 'flex', justifyContent: 'center', marginTop: '-70px', marginBottom: '20px' },
    avatar: { width: '140px', height: '140px', borderRadius: '50%', backgroundColor: '#1a1a1e', border: '4px solid #121218' },
    mainContainer: { borderTop: '1px solid #333', paddingTop: '20px' },
    profileNav: { display: 'flex', justifyContent: 'flex-start', gap: '20px', marginBottom: '30px' },
    profileLink: { padding: '10px 0', textDecoration: 'none', color: '#ffff00', fontWeight: 'bold', fontSize: '2em', borderBottom: '3px solid transparent', cursor: 'pointer' },
    profileLinkActive: { padding: '10px 0', textDecoration: 'none', color: '#ffff00', fontWeight: 'bold', fontSize: '2em', borderBottom: '3px solid #ffff00', cursor: 'pointer' },
    content: { paddingTop: '20px' },
};