import { ethers } from "ethers";
import EscrowABI from "../../abi/AnomarketEscrow.json";

const escrowContracts = {
    11155111: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ETHEREUM,
    84532: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_BASE,
    421614: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ARBITRUM,
};
const rpcProviders = {
    11155111: process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL,
    84532: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
    421614: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL,
};

export default async function handler(req, res) {
        // --- ДИАГНОСТИКА ---
    console.log("\n--- ПОЛУЧЕН ЗАПРОС НА БЭКЕНД ---");
    console.log("Тело запроса (req.body):", req.body);
    // --- КОНЕЦ ДИАГНОСТИКИ ---
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { listingId, buyerAddress, paymentTxHash, paymentChainId, originChainId } = req.body;

    if (listingId === undefined || !buyerAddress || !paymentTxHash || !paymentChainId || !originChainId) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        const originProvider = new ethers.JsonRpcProvider(rpcProviders[originChainId]);
        const originEscrowAddress = escrowContracts[originChainId];
        if (!originProvider || !originEscrowAddress) {
            throw new Error(`Unsupported origin chain ID: ${originChainId}`);
        }
        
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, originProvider);
        const originEscrowContract = new ethers.Contract(
            originEscrowAddress,
            EscrowABI,
            signer
        );

        const listing = await originEscrowContract.listings(listingId);
        if (!listing.active) {
            return res.status(400).json({ error: "This listing is no longer active." });
        }

        const isChainAllowed = await originEscrowContract.isPaymentChainAllowed(listingId, paymentChainId);
        if (!isChainAllowed) {
            throw new Error(`Payment in chain ${paymentChainId} is not allowed by the seller.`);
        }

        const paymentProvider = new ethers.JsonRpcProvider(rpcProviders[paymentChainId]);
        if (!paymentProvider) {
            throw new Error(`Unsupported payment chain ID: ${paymentChainId}`);
        }
        
        console.log(`Ожидаем подтверждения транзакции ${paymentTxHash} в сети ${paymentChainId}...`);
        
        const txReceipt = await paymentProvider.waitForTransaction(paymentTxHash, 1, 120000);

        if (!txReceipt || txReceipt.status !== 1) {
            throw new Error("Транзакция оплаты не найдена или не успешна после ожидания.");
        }
        
        const tx = await paymentProvider.getTransaction(paymentTxHash);
        if (tx.to.toLowerCase() !== listing.seller.toLowerCase()) {
            throw new Error(`Неправильный получатель платежа.`);
        }
        if (tx.value !== listing.price) {
            throw new Error(`Неправильная сумма платежа.`);
        }
        
        console.log("Оплата подтверждена!");
        
        const saleTx = await originEscrowContract.executeCrossChainSale(listingId, buyerAddress);
        await saleTx.wait();

        console.log("Кросс-чейн сделка успешно выполнена! Tx hash:", saleTx.hash);
        res.status(200).json({ success: true, txHash: saleTx.hash });

    } catch (error) {
        console.error("Критическая ошибка при выполнении сделки:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}