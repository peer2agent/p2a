import { Helius, TransactionType } from "helius-sdk";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";
import startServer from "./server";

dotenv.config();

class WalletTracker {
    private readonly helius: Helius;
    private readonly apiKey: string;
    private readonly trackedWallet: string;
    private readonly webhookURL: string;
    private initialAssetDistribution: any;
    private assetsByOwnerOutput: any;

    constructor(apiKey: string, trackedWallet: string, webhookURL: string) {
        this.helius = new Helius(apiKey);
        this.apiKey = apiKey;
        this.trackedWallet = trackedWallet;
        this.webhookURL = webhookURL;
    }

    async getAssetsByOwner(wallet: string): Promise<any> {
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
                `[${this.formatTimestamp()}] Saving output data to JSON...`
            );
            this.storeOutputInJsonFile(outputData);

            this.assetsByOwnerOutput = outputData;
        } catch (error) {
            console.error(
                `[${this.formatTimestamp()}] Error fetching assets for wallet: ${wallet}`,
                error
            );
        }
    }

    async createWebhookIfNotExists() {
        const apiKey = process.env.HELIUS_API_KEY!;
        const helius = new Helius(apiKey);

        // Desired webhook URL and other details
        const desiredWebhookURL = this.webhookURL;
        const webhookTypes: TransactionType[] = [TransactionType.ANY];
        const webhookAccountAddresses = [this.trackedWallet];

        try {
            console.log("Fetching existing webhooks...");

            // Fetch all webhooks associated with the account
            const existingWebhooks = await helius.getAllWebhooks();

            console.log("Checking if the desired webhook already exists...");
            const webhookAlreadyExists = existingWebhooks.some(
                (webhook: any) => webhook.webhookURL === desiredWebhookURL
            );

            if (webhookAlreadyExists) {
                console.log("Webhook already exists. Skipping creation.");
                return;
            }

            console.log("Webhook does not exist. Creating new webhook...");

            // Create a new webhook
            const newWebhook = await helius.createWebhook({
                webhookURL: desiredWebhookURL,
                transactionTypes: webhookTypes,
                accountAddresses: webhookAccountAddresses,
            });

            console.log("Webhook created successfully:", newWebhook);
        } catch (error) {
            console.error("Error while creating or checking webhook:", error);
        }
    }

    calculateAssetDistribution(): void {
        const outputData = this.assetsByOwnerOutput;

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

            const percentage = (totalPrice / totalValue) * 100;

            return {
                id: asset.id,
                symbol: symbol,
                totalPrice: totalPrice,
                quantity: quantity,
                percentage:
                    percentage < 1
                        ? percentage.toPrecision(3)
                        : percentage.toFixed(2),
            };
        });

        // Add native token to the distribution
        const solQuantity = nativeBalanceAmount / 1e9;
        const nativePercentage = (nativeBalancePrice / totalValue) * 100;

        distribution.push({
            id: "SOL",
            symbol: "SOL",
            totalPrice: nativeBalancePrice,
            quantity: solQuantity,
            percentage:
                nativePercentage < 1
                    ? nativePercentage.toPrecision(3)
                    : nativePercentage.toFixed(2),
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

        this.initialAssetDistribution = distribution;
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

function parseJsonAndExtractTokenTransfers(filePath: string) {
  try {
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const parsedData = jsonData
      .map((transaction: any) => {
        if (
          transaction.tokenTransfers &&
          transaction.tokenTransfers.length > 0
        ) {
          const firstTransfer = transaction.tokenTransfers[0];
          return {
            fromTokenAccount: firstTransfer.fromTokenAccount,
            fromUserAccount: firstTransfer.fromUserAccount,
            mint: firstTransfer.mint,
            toTokenAccount: firstTransfer.toTokenAccount,
            toUserAccount: firstTransfer.toUserAccount,
          };
        } else {
          return null; 
        }
      })
      .filter((item: any) => item !== null); 

    return parsedData;
  } catch (error) {
    console.error("Erro ao processar o arquivo JSON:", error);
    return null;
  }
}



async function main(
    apiKey: string,
    wallet: string,
    webhookURL: string
): Promise<void> {    

  startServer();

  const obfuscatedApiKey = `${apiKey.slice(0, 3)}***${apiKey.slice(-3)}`;
    console.log(
        `\n[${new Date().toISOString()}] Initializing WalletTracker...`
    );
    console.log(`[${new Date().toISOString()}] API Key: ${obfuscatedApiKey}`);
    console.log(`[${new Date().toISOString()}] Wallet Address: ${wallet}\n`);

    const tracker = new WalletTracker(apiKey, wallet, webhookURL);

    try {
        console.log(
            `[${new Date().toISOString()}] Checking and creating webhook if needed...`
        );
        await tracker.createWebhookIfNotExists();

        console.log(
            `[${new Date().toISOString()}] Fetching assets for wallet...`
        );
        await tracker.getAssetsByOwner(wallet);
        tracker.calculateAssetDistribution();

        const filePath = "./webhook.json"; 
        const tokenTransferData = parseJsonAndExtractTokenTransfers(
          filePath
        );

        if (tokenTransferData) {
            console.log(
                `[${new Date().toISOString()}] Token Transfer Data:`,
                JSON.stringify(tokenTransferData, null, 2)
            );
        }

        console.log(
            `[${new Date().toISOString()}] Process completed successfully.\n`
        );
    } catch (error) {
        console.error(
            `[${new Date().toISOString()}] Error during WalletTracker execution.`,
            error
        );
    }
}


const apiKey = process.env.HELIUS_API_KEY!;
const wallet = process.env.WALLET_ADDRESS!;
const webhookURL = process.env.WEBHOOK_URL!;

main(apiKey, wallet, webhookURL);
