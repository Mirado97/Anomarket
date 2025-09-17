// pages/_app.js
import "../styles/globals.css";
import dynamic from 'next/dynamic';
import Layout from '../components/Layout'; // Импортируем наш макет

const Web3Provider = dynamic(() => import('../components/Web3Provider').then(mod => mod.Web3Provider), {
  ssr: false,
});

function MyApp({ Component, pageProps }) {
  return (
    <Web3Provider>
      <Layout> {/* Оборачиваем все страницы в Layout */}
        <Component {...pageProps} />
      </Layout>
    </Web3Provider>
  );
}

export default MyApp;