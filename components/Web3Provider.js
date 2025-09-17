import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia, baseSepolia, arbitrumSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const transports = {
  [sepolia.id]: http(process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL),
  [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
  [arbitrumSepolia.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL),
};

const config = createConfig(
  getDefaultConfig({
    appName: "Anomarket",
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    chains: [sepolia, baseSepolia, arbitrumSepolia],
    transports: transports,
  })
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};