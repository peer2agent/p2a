import { Helius, TransactionType, WebhookType } from "helius-sdk";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

class WalletTracker {
    private readonly helius: Helius;
    private readonly apiKey: string;
    private readonly trackedWallet: string;
    private readonly assets = {};

    constructor(apiKey: string, trackedWallet: string) {
        this.helius = new Helius(apiKey);

        this.trackedWallet = trackedWallet;
        this.apiKey = apiKey;
        this.assets = {};
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

        this.storeOutputInJsonFile(outputData);
    }

    createWebhook(webhookUrl: string): void {
        this.helius.createWebhook({
            webhookURL: webhookUrl,
            transactionTypes: [TransactionType.SWAP],
            accountAddresses: [this.trackedWallet],
            webhookType: WebhookType.RAW,
        });
    }

    storeOutputInJsonFile(outputData: any): void {
        const outputDir = path.join(__dirname, "output");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const outputFile = path.join(outputDir, `${timestamp}.json`);

        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

        fs.writeFileSync(
            outputFile,
            JSON.stringify(outputData, null, 2),
            "utf-8"
        );
        console.log(`Assets written to ${outputFile}`);
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

    tracker.createWebhook(webhookURL);
}

const apiKey = process.env.HELIUS_API_KEY!;
const wallet = process.env.WALLET_ADDRESS!;
const webhookURL = process.env.WEBHOOK_URL!;

console.log("API Key: ", apiKey);
console.log("Wallet Address: ", wallet);

main(apiKey, wallet, webhookURL);
