import { Helius, TransactionType } from "helius-sdk";


export class HeliusClient {
    private readonly trackedWallet: string;
    private readonly webhookURL: string;
    private readonly helius: Helius;

    constructor(webhookURL: string, trackedWallet: string, apiKey: string) {
        this.trackedWallet = trackedWallet;
        this.webhookURL = webhookURL;
        this.helius = new Helius(apiKey);
    }

    async createWebhookIfNotExists() {
        const helius = this.helius;
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
    
    
    async getAssetsByOwner(wallet: string): Promise<any> {
        console.log(`\n[${this.formatTimestamp()}] Starting fetch for wallet: ${wallet}`);
    
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
        
            return assets;

        } catch (error) {
          console.error(
            `[${this.formatTimestamp()}] Error fetching assets for wallet: ${wallet}`,
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