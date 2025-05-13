import { HeliusClient } from "../client/HeliusClient";
import { WalletFactory } from "./WalletFactory";
import { WalletDTO } from "../dto/WalletDTO";

export class WalletTrackerImpl {
  public webhookURL: string;
  public apiKey: string;
  public heliusClient!: HeliusClient;

  constructor() {
    
    this.webhookURL = process.env.WEBHOOK_URL!!;
    this.apiKey = process.env.HELIUS_API_KEY!!;
    
  }

  async getDistribution(wallet:string): Promise<WalletDTO> {
    const obfuscatedApiKey = `${this.apiKey.slice(0, 3)}***${this.apiKey.slice(-3)}`;

    console.log(`\n[${new Date().toISOString()}] Initializing WalletTracker...`);

    console.log(`[${new Date().toISOString()}] API Key: ${obfuscatedApiKey}`);

    console.log(`[${new Date().toISOString()}] Wallet Address: ${wallet}\n`);
    
    console.log(`[${new Date().toISOString()}] Checking and creating webhook if needed...`);

    try {
    
      const assets = await this.heliusClient.getAssetsByOwner(wallet);

      console.log(assets)

      const tracker = new WalletFactory(assets);

      console.log(`[${new Date().toISOString()}] Fetching assets for wallet...`);

      tracker.getFilteredAssetsByOwner(wallet); 

      tracker.calculateAssetDistribution();

      console.log(`[${new Date().toISOString()}] Process completed successfully.\n`);

      let walletDTO: WalletDTO = {
        usdBalance: tracker.totalAmountUsd,
        filteredTokens: tracker.initialAssetDistribution,
      };

      return walletDTO;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error during WalletTracker execution.`,
        error
      );
      throw error;
    }
  }

  async createWebhook(wallets: string[]) {

    this.heliusClient = new HeliusClient(
      this.webhookURL,
      wallets,
      this.apiKey
    );

    console.log(`[${new Date().toISOString()}] Creating webhook...`);

    try {
      await this.heliusClient.setWebhook();
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error while creating webhook.`,
        error)
  }
}

}
