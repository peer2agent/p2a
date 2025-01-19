import { WalletTrackerClient } from "../client/WalletTrackerClient";
import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";

export class WalletTrackerImpl {
  async initiateServer(
    trackingInfoInputDTO: TrackingInfoInputDTO
  ): Promise<void> {
    const { apiKey, trackedWallet, webhookURL } = trackingInfoInputDTO;
    const obfuscatedApiKey = `${apiKey.slice(0, 3)}***${apiKey.slice(-3)}`;
    console.log(
      `\n[${new Date().toISOString()}] Initializing WalletTracker...`
    );
    console.log(`[${new Date().toISOString()}] API Key: ${obfuscatedApiKey}`);
    console.log(
      `[${new Date().toISOString()}] Wallet Address: ${trackedWallet}\n`
    );

    const tracker = new WalletTrackerClient(apiKey, trackedWallet, webhookURL);

    try {
      console.log(
        `[${new Date().toISOString()}] Checking and creating webhook if needed...`
      );
      await tracker.createWebhookIfNotExists();

      console.log(
        `[${new Date().toISOString()}] Fetching assets for wallet...`
      );
      await tracker.getAssetsByOwner(trackedWallet);
      tracker.calculateAssetDistribution();

      // const filePath = "./webhook.json";
      // const tokenTransferData = parseJsonAndExtractTokenTransfers(
      //   filePath
      // );

      // if (tokenTransferData) {
      //     console.log(
      //         `[${new Date().toISOString()}] Token Transfer Data:`,
      //         JSON.stringify(tokenTransferData, null, 2)
      //     );
      // }

      console.log(
        `[${new Date().toISOString()}] Process completed successfully.\n`
      );
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error during WalletTracker execution.`,
        error
      );
    } finally {
      return tracker.initialAssetDistribution;
    }
  }
}
