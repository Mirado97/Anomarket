// components/Layout.js
import Header from './Header';

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#121218',
        color: '#e0e0e0',
        fontFamily: 'system-ui, sans-serif',
    },
    main: {
        flex: 1,
        padding: '20px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
    }
};

export default function Layout({ children }) {
    return (
        <div style={styles.container}>
            <Header />
            <main style={styles.main}>
                {children}
            </main>
        </div>
    );
}