import { Helius, TransactionType } from "helius-sdk";

export class HeliusClient {
  private readonly trackedWallet: string[];
  private readonly webhookURL: string;
  private readonly helius: Helius;

  constructor(webhookURL: string, trackedWallet: string[], apiKey: string) {
    this.trackedWallet = trackedWallet;
    this.webhookURL = webhookURL;
    this.helius = new Helius(apiKey);
  }

  async setWebhook(): Promise<void> {
    try {
      console.log("Adicionando webhook...");
      const existingWebhooks = await this.helius.getAllWebhooks();
      const targetWebhook = existingWebhooks.find((wh: any) => wh.webhookURL === this.webhookURL);
      if (!targetWebhook) {
        console.error("Webhook não encontrado. Certifique-se de que ele exista antes de tentar adicionar endereços.");
        this.createWebhook();
        return
      }

      const newWebhook = await this.helius.appendAddressesToWebhook(targetWebhook.webhookID, this.trackedWallet);
      console.log("Webhook adicionado com sucesso:", newWebhook);
    } catch (error) {
      console.error("Erro ao adicionar o webhook:", error);
    }
  }

  async webhookAlreadyExists(): Promise<boolean> {
    const existingWebhooks = await this.helius.getAllWebhooks();
    const webhookAlreadyExists = existingWebhooks.some(
      (webhook: any) => webhook.webhookURL === this.webhookURL
    );
    return webhookAlreadyExists;
  }

  async createWebhook() {
    try {
      console.log("Fetching existing webhooks...");
      console.log("Checking if the desired webhook already exists...");

      if (await this.webhookAlreadyExists()) {
        console.log("Webhook already exists. Skipping creation.");
        return;
      }

      console.log("Webhook does not exist. Creating new webhook...");

      // Cria um novo webhook
      const newWebhook = await this.helius.createWebhook({
        webhookURL: this.webhookURL,
        transactionTypes: [TransactionType.ANY],
        accountAddresses: this.trackedWallet,
      });

      console.log("Webhook created successfully:", newWebhook);
    } catch (error) {
      console.error("Error while creating or checking webhook:", error);
    }
  }

  async getAssetsByOwner(wallet: string): Promise<any> {
    console.log(`\n[${this.formatTimestamp()}] Starting fetch for wallet: ${wallet}`);
    
    try {
      const assets = await this.helius.rpc.getAssetsByOwner({
        ownerAddress: wallet,
        page: 1,
        limit: 100,
        displayOptions: {
          showFungible: true,
          showNativeBalance: true,
          showGrandTotal: true,
        },
      });

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
