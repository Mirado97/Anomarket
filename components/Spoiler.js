// components/Spoiler.js
import { useState } from 'react';

export default function Spoiler({ title, children }) {
    const [isOpen, setIsOpen] = useState(true); // По умолчанию открыт

    return (
        <div style={styles.spoiler}>
            <button style={styles.button} onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                <span style={{transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s'}}>{'▼'}</span>
            </button>
            {isOpen && (
                <div style={styles.content}>
                    {children}
                </div>
            )}
        </div>
    );
}

const styles = {
    spoiler: { marginBottom: '10px', border: '1px solid #262626', borderRadius: '10px' },
    button: { width: '100%', background: '#1a1a1e', border: 'none', color: '#fff', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '1.1em', fontWeight: 'bold' },
    content: { padding: '0 15px 15px 15px' },
};