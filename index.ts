import { Helius, TransactionType, WebhookType } from "helius-sdk";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

class WalletTracker {
    private readonly helius: Helius;
    private readonly apiKey: string;
    private readonly trackedWallet: string;

    constructor(apiKey: string, trackedWallet: string) {
        this.helius = new Helius(apiKey);
        this.apiKey = apiKey;
        this.trackedWallet = trackedWallet;
    }

    async getAssetsByOwner(wallet: string): Promise<void> {
        const assets = (await this.helius.rpc.getAssetsByOwner({
            ownerAddress: wallet,
            page: 1,
            limit: 100,
            displayOptions: {
                showFungible: true,
                showNativeBalance: true,
                showGrandTotal: true,
            },
        })) as any;

        const response = { ...assets };

        const filteredAssets = response.items.filter(
            (asset: any) => asset.interface !== "V1_NFT"
        );

        const outputData = {
            wallet: wallet,
            assets: filteredAssets,
            nativeBalance: response.nativeBalance,
        };

        console.log("Assets fetched successfully. Calculating distribution...");
        this.calculateAssetDistribution(outputData);

        console.log("Storing output in JSON file...");
        this.storeOutputInJsonFile(outputData);
    }

    calculateAssetDistribution(outputData: any): void {
        const assets = outputData.assets;
        console.log(`Total assets: ${assets.length}`);

        // Captura o valor em SOL (Native Balance)
        const nativeBalancePrice = outputData.nativeBalance?.total_price || 0;
        const nativeBalanceAmount = outputData.nativeBalance?.lamports || 0;

        // Soma os valores dos tokens fungíveis e SOL
        const totalValue = assets.reduce(
            (sum: number, asset: any) =>
                sum + (asset.token_info?.price_info?.total_price || 0),
            nativeBalancePrice
        );

        if (totalValue === 0) {
            console.error(
                "Total value of assets is zero. Cannot calculate distribution."
            );
            return;
        }

        console.log(`Total value of assets: ${totalValue.toFixed(2)} USDC`);

        // Calcula a distribuição dos ativos fungíveis
        const distribution = assets.map((asset: any) => {
            const totalPrice = asset.token_info?.price_info?.total_price || 0;
            const symbol = asset.token_info?.symbol || "Unknown";
            const balance = asset.token_info?.balance || 0;
            const decimals = asset.token_info?.decimals || 0;
            const quantity = balance / Math.pow(10, decimals); // Calcula a quantidade de tokens

            return {
                id: asset.id,
                symbol: symbol,
                totalPrice: totalPrice,
                quantity: quantity,
                percentage: ((totalPrice / totalValue) * 100).toFixed(2),
            };
        });

        // Adiciona o saldo em SOL à distribuição
        const solQuantity = nativeBalanceAmount / 1e9; // Convertendo lamports para SOL
        distribution.push({
            id: "SOL",
            symbol: "SOL",
            totalPrice: nativeBalancePrice,
            quantity: solQuantity,
            percentage: ((nativeBalancePrice / totalValue) * 100).toFixed(2),
        });

        console.log("Asset Distribution:");
        distribution.forEach((d: any) =>
            console.log(
                `Asset ID: ${d.id}, Symbol: ${
                    d.symbol
                }, Quantity: ${d.quantity.toFixed(
                    6
                )}, Total Price: ${d.totalPrice.toFixed(
                    2
                )} USDC, Distribution: ${d.percentage}%`
            )
        );

        this.storeOutputInJsonFile(distribution);
    }

    storeOutputInJsonFile(outputData: any): void {
        const outputDir = path.join(__dirname, "output");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const outputFile = path.join(outputDir, `${timestamp}.json`);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
    }
}

function main(apiKey: string, wallet: string, webhookURL: string): void {
    const tracker = new WalletTracker(apiKey, wallet);
    tracker
        .getAssetsByOwner(wallet)
        .then(() => {
            console.log("Assets fetched successfully");
        })
        .catch((error) => {
            console.error("Error fetching assets", error);
        });
}

const apiKey = process.env.HELIUS_API_KEY!;
const wallet = process.env.WALLET_ADDRESS!;
const webhookURL = process.env.WEBHOOK_URL!;

console.log("API Key: ", apiKey);
console.log("Wallet Address: ", wallet);

main(apiKey, wallet, webhookURL);
