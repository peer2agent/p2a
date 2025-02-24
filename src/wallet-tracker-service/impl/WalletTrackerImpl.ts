import { HeliusClient } from "../client/HeliusClient";
import { WalletFactory } from "./factory/WalletFactory";
import { HistorySwapTokenDTO } from "../dto/HistorySwapTokenDTO";
import { WalletDTO } from "../dto/WalletDTO";

export class WalletTrackerImpl {
  public webhookURL: string;
  public apiKey: string;

  constructor(apiKey: string, webhookURL: string) {
    this.webhookURL = webhookURL;
    this.apiKey = apiKey;
  }

  async initiateServer(wallet: string): Promise<WalletDTO> {
    const obfuscatedApiKey = `${this.apiKey.slice(0, 3)}***${this.apiKey.slice(
      -3
    )}`;

    console.log(
      `\n[${new Date().toISOString()}] Initializing WalletTracker...`
    );

    console.log(`[${new Date().toISOString()}] API Key: ${obfuscatedApiKey}`);
    console.log(`[${new Date().toISOString()}] Wallet Address: ${wallet}\n`);
    console.log(
      `[${new Date().toISOString()}] Checking and creating webhook if needed...`
    );
    try {
      const heliusClient = new HeliusClient(
        this.webhookURL,
        wallet,
        this.apiKey
      );

      const assets = await heliusClient.getAssetsByOwner(wallet);

      const tracker = new WalletFactory(assets);

      await heliusClient.createWebhookIfNotExists();

      console.log(
        `[${new Date().toISOString()}] Fetching assets for wallet...`
      );

      await tracker.getAssetsByOwner(wallet);

      tracker.calculateAssetDistribution();

      console.log(
        `[${new Date().toISOString()}] Process completed successfully.\n`
      );

      let walletDTO: WalletDTO = {
        usdBallance: tracker.totalAmountUsd,
        tokens: tracker.initialAssetDistribution,
      }

      return walletDTO;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error during WalletTracker execution.`,
        error
      );
      throw error;
    }
  }
}
