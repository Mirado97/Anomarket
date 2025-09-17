
  Anomarket 

[Anomarket Showcase](https://youtu.be/duVZXlhkumQ) <---- Click to view demo

> Anomarket is an intent-based, cross-chain NFT marketplace prototype built for the Anoma ecosystem. Sell NFTs from one chain, get paid on another.

---

## 💡 Core Concept: Intent-Centric Swaps

Anomarket is built around the core philosophy of **intents**. Instead of forcing users to bridge assets, we allow them to express their desired outcome directly.

A user can create an intent like:
> "I want to sell my NFT located on **Ethereum Sepolia**, and I am willing to accept payment of 0.1 ETH on **Base Sepolia** OR **Arbitrum Sepolia**."

The marketplace's off-chain "solver" (the backend) finds this intent, verifies the payment on the chosen network, and executes the NFT transfer on the origin network. This creates a seamless cross-chain experience without the user ever needing to use a traditional asset bridge.

## ✨ Key Features

* **Multi-Chain Listings:** List NFTs for sale from any supported network (Ethereum, Base, Arbitrum testnets).
* **Cross-Chain Payments:** Accept payments in a different network than where the NFT is located.
* **Centralized Solver Model:** A backend service acts as a trusted solver to monitor and execute trades, simulating how a decentralized solver network would function.
* **Aggregated Showcase & Profile:** The homepage aggregates all listings from all supported chains. The user profile aggregates all owned NFTs from all chains.
* **On-Chain Security:** All NFTs are held securely in an ERC1155-compliant escrow smart contract (`AnomarketEscrow.sol`) during the listing period.
* **Dynamic Filtering:** Filter the showcase and profile views by origin chain and search query.

## 🛠️ Tech Stack

* **Frontend:** React, Next.js, Ethers.js, Wagmi, ConnectKit
* **Blockchain:** Solidity, OpenZeppelin
* **Backend:** Next.js API Routes (acting as a centralized solver)
* **Services:** Alchemy (for RPC & NFT API)
* **Testnets:** Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

* [Node.js](https://nodejs.org/en/) (v18 or later)
* [npm](https://www.npmjs.com/)
* A browser wallet like MetaMask or Rabby

### 1. Clone the Repository

```bash
git clone [https://github.com/Mirado97/Anomarket.git](https://github.com/Mirado97/Anomarket.git)
cd Anomarket
```
### 2. Install Dependencies
```
npm install
```

### 3. Set Up Environment Variables
Create a file named .env.local in the root of the project and fill it with your own keys and addresses.

```
# A fresh wallet's private key for the backend solver to pay for gas
PRIVATE_KEY="0x..."

# RPC URLs from a service like Alchemy
NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL="[https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY](https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY)"
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL="[https://base-sepolia.g.alchemy.com/v2/YOUR_KEY](https://base-sepolia.g.alchemy.com/v2/YOUR_KEY)"
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL="[https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY](https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY)"

# Addresses of the deployed AnomarketEscrow.sol contract on each network
NEXT_PUBLIC_ESCROW_CONTRACT_ETHEREUM="0x..."
NEXT_PUBLIC_ESCROW_CONTRACT_BASE="0x..."
NEXT_PUBLIC_ESCROW_CONTRACT_ARBITRUM="0x..."

# Project ID from WalletConnect Cloud
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="YOUR_WALLETCONNECT_ID"

# A generic API Key from Alchemy for the NFT API
NEXT_PUBLIC_ALCHEMY_API_KEY="YOUR_ALCHEMY_KEY"
```

### 4. Deploy Smart Contracts
The AnomarketEscrow.sol contract (located in /contracts) needs to be deployed to each of the three testnets (Ethereum Sepolia, Base Sepolia, and Arbitrum Sepolia). You can use Remix IDE for this.

After deploying, paste the contract addresses into your .env.local file.

Important: The test version of the contract has the onlyOwner modifier removed for easier testing. For a production version, this would be re-enabled, and ownership of each contract would need to be transferred to the backend solver's address.

5. Run the Application

```
npm run dev
```
### Open http://localhost:3000 in your browser.

📄 License
This project is licensed under the MIT License.
