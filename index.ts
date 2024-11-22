import { Helius } from "helius-sdk";
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
        console.log(
            `\n[${this.formatTimestamp()}] Starting fetch for wallet: ${wallet}`
        );

        try {
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

            console.log(
                `[${this.formatTimestamp()}] Fetched assets successfully for wallet: ${wallet}`
            );

            const filteredAssets = assets.items.filter(
                (asset: any) => asset.interface !== "V1_NFT"
            );

            const outputData = {
                wallet: wallet,
                assets: filteredAssets,
                nativeBalance: assets.nativeBalance,
            };

            console.log(
                `[${this.formatTimestamp()}] Processing asset distribution...`
            );
            this.calculateAssetDistribution(outputData);

            console.log(
                `[${this.formatTimestamp()}] Saving output data to JSON...`
            );
            this.storeOutputInJsonFile(outputData);
        } catch (error) {
            console.error(
                `[${this.formatTimestamp()}] Error fetching assets for wallet: ${wallet}`,
                error
            );
        }
    }

    calculateAssetDistribution(outputData: any): void {
        console.log(
            `\n[${this.formatTimestamp()}] Calculating asset distribution for wallet: ${
                outputData.wallet
            }`
        );

        const assets = outputData.assets;
        const nativeBalanceAmount = outputData.nativeBalance?.lamports || 0;

        // Include native token in the total assets count
        const totalAssets = assets.length + (nativeBalanceAmount > 0 ? 1 : 0);
        console.log(
            `[${this.formatTimestamp()}] Total assets (including native token): ${totalAssets}`
        );

        const nativeBalancePrice = outputData.nativeBalance?.total_price || 0;

        const totalValue = assets.reduce(
            (sum: number, asset: any) =>
                sum + (asset.token_info?.price_info?.total_price || 0),
            nativeBalancePrice
        );

        if (totalValue === 0) {
            console.error(
                `[${this.formatTimestamp()}] Total value of assets is zero. Cannot calculate distribution.`
            );
            return;
        }

        console.log(
            `[${this.formatTimestamp()}] Total value of assets: ${totalValue.toFixed(
                2
            )} USDC`
        );

        const distribution = assets.map((asset: any) => {
            const totalPrice = asset.token_info?.price_info?.total_price || 0;
            const symbol = asset.token_info?.symbol || "Unknown";
            const balance = asset.token_info?.balance || 0;
            const decimals = asset.token_info?.decimals || 0;
            const quantity = balance / Math.pow(10, decimals);

            return {
                id: asset.id,
                symbol: symbol,
                totalPrice: totalPrice,
                quantity: quantity,
                percentage: ((totalPrice / totalValue) * 100).toFixed(2),
            };
        });

        // Add native token to the distribution
        const solQuantity = nativeBalanceAmount / 1e9;
        distribution.push({
            id: "SOL",
            symbol: "SOL",
            totalPrice: nativeBalancePrice,
            quantity: solQuantity,
            percentage: ((nativeBalancePrice / totalValue) * 100).toFixed(2),
        });

        console.log(`\n[${this.formatTimestamp()}] Asset Distribution:`);
        distribution.forEach((d: any) => {
            console.log(
                `Asset Details:\n` +
                    `  - ID: ${d.id}\n` +
                    `  - Symbol: ${d.symbol}\n` +
                    `  - Quantity: ${d.quantity.toFixed(6)}\n` +
                    `  - Total Price: ${d.totalPrice.toFixed(2)} USDC\n` +
                    `  - Distribution: ${d.percentage}%\n`
            );
        });
    }

    storeOutputInJsonFile(outputData: any): void {
        console.log(
            `\n[${this.formatTimestamp()}] Storing output data to JSON...`
        );
        try {
            const outputDir = path.join(__dirname, "output");
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const outputFile = path.join(outputDir, `${timestamp}.json`);

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
                console.log(
                    `[${this.formatTimestamp()}] Output directory created.`
                );
            }

            fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
            console.log(
                `[${this.formatTimestamp()}] Output data saved to file: ${outputFile}`
            );
        } catch (error) {
            console.error(
                `[${this.formatTimestamp()}] Error saving output data to file.`,
                error
            );
        }
    }

    private formatTimestamp(): string {
        const now = new Date();
        return now
            .toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            })
            .replace(",", "");
    }
}

function main(apiKey: string, wallet: string, webhookURL: string): void {
    const obfuscatedApiKey = `${apiKey.slice(0, 3)}***${apiKey.slice(-3)}`;
    console.log(
        `\n[${new Date().toISOString()}] Initializing WalletTracker...`
    );
    console.log(`[${new Date().toISOString()}] API Key: ${obfuscatedApiKey}`);
    console.log(`[${new Date().toISOString()}] Wallet Address: ${wallet}\n`);

    const tracker = new WalletTracker(apiKey, wallet);

    tracker
        .getAssetsByOwner(wallet)
        .then(() => {
            console.log(
                `\n[${new Date().toISOString()}] Process completed successfully.\n`
            );
        })
        .catch((error) => {
            console.error(
                `\n[${new Date().toISOString()}] Error during WalletTracker execution.\n`,
                error
            );
        });
}

const apiKey = process.env.HELIUS_API_KEY!;
const wallet = process.env.WALLET_ADDRESS!;
const webhookURL = process.env.WEBHOOK_URL!;

main(apiKey, wallet, webhookURL);
