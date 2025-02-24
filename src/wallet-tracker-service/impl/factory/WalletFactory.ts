import { HistorySwapTokenDTO } from "../../dto/HistorySwapTokenDTO";

export class WalletFactory {
  public initialAssetDistribution: any;
  private assetsByOwnerOutput: any;
  private assets: any;

  constructor(assets: any) {
    this.assets = assets;
  }

  async getAssetsByOwner(wallet: string): Promise<any> {
    console.log(
      `\n[${this.formatTimestamp()}] Starting fetch for wallet: ${wallet}`
    );

    try {
      console.log(
        `[${this.formatTimestamp()}] Fetched assets successfully for wallet: ${wallet}`
      );

      const filteredAssets = this.assets.items.filter(
        (asset: any) => asset.interface !== "V1_NFT"
      );

      const outputData = {
        wallet: wallet,
        assets: filteredAssets,
        nativeBalance: this.assets.nativeBalance,
      };

      this.assetsByOwnerOutput = outputData;
    } catch (error) {
      console.error(
        `[${this.formatTimestamp()}] Error fetching assets for wallet: ${wallet}`,
        error
      );
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

    const distribution: HistorySwapTokenDTO[] = assets.map((asset: any) => {
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
        percentage: parseFloat(
          percentage < 1 ? percentage.toPrecision(3) : percentage.toFixed(2)
        ),
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
      percentage: parseFloat(
        nativePercentage < 1
          ? nativePercentage.toPrecision(3)
          : nativePercentage.toFixed(2)
      ),
    });

    console.log(`\n[${this.formatTimestamp()}] Asset Distribution:`);
    distribution.forEach((historySwapTokenDTO: HistorySwapTokenDTO) => {
      console.log(
        `Asset Details:\n` +
          `  - ID: ${historySwapTokenDTO.id}\n` +
          `  - Symbol: ${historySwapTokenDTO.symbol}\n` +
          `  - Quantity: ${historySwapTokenDTO.quantity.toFixed(6)}\n` +
          `  - Total Price: ${historySwapTokenDTO.totalPrice.toFixed(
            2
          )} USDC\n` +
          `  - Distribution: ${historySwapTokenDTO.percentage}%\n`
      );
    });

    this.initialAssetDistribution = distribution.filter((obj:HistorySwapTokenDTO)=>{return obj.percentage >= 0.1});
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
