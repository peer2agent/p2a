import { SwapTransactionDTO } from "../../dto/TransactionDTO";
import { SwapPlatform, TransactionType } from "../../enum/TransactionEnum";
import { BaseNormalizerImpl } from "./BaseNormalizerImpl";

interface TokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  mint: string;
  tokenAmount: number;
  decimals?: number;
}

interface SwapEvent {
  innerSwaps: {
    tokenInputs: TokenTransfer[];
    tokenOutputs: TokenTransfer[];
  }[];
}

interface WebhookData {
  source?: string;
  feePayer?: string;
  tokenTransfers: TokenTransfer[];
  signature: string;
  timestamp?: number;
  transactionError?: any;
  fee?: number;
  events?: {
    swap?: SwapEvent;
  };
  accountData?: {
    account: string;
    tokenBalanceChanges: {
      mint: string;
      rawTokenAmount: {
        decimals: number;
        tokenAmount: string;
      };
    }[];
  }[];
}

export class JupiterNormalizerImpl extends BaseNormalizerImpl {

  canHandle(data: WebhookData): boolean {
    return data.source === "JUPITER";
  }

  private getTokenDecimals(
    data: WebhookData,
    mint: string
  ): number | undefined {
    // Tenta encontrar decimais nos accountData
    const tokenChange = data.accountData
      ?.find((account) =>
        account.tokenBalanceChanges.some((change) => change.mint === mint)
      )
      ?.tokenBalanceChanges.find((change) => change.mint === mint);

    return tokenChange?.rawTokenAmount.decimals;
  }

  normalize(data: WebhookData): SwapTransactionDTO {
    const transfers = data.tokenTransfers;
    let input, output;

    console.log("🌐Jupter swap detected!");

    if (data.events?.swap) {
      const swapEvent = data.events.swap;
      const innerSwaps = swapEvent.innerSwaps || [];

      const firstSwap = innerSwaps[0];
      const lastSwap = innerSwaps[innerSwaps.length - 1];

      if (firstSwap && lastSwap) {
        input = firstSwap.tokenInputs[0];
        output = lastSwap.tokenOutputs[0];
      }
    }

    if (!input || !output) {
      const significantTransfers = transfers.filter(
        (t) =>
          t.tokenAmount > 0.001 ||
          t.mint !== "So11111111111111111111111111111111111111112"
      );

      input = significantTransfers.find(
        (t) => t.fromUserAccount === this.trackedWallet
      );
      output = significantTransfers.find(
        (t) => t.toUserAccount === this.trackedWallet
      );
    }

    if (!input || !output) {
      throw new Error("Invalid Jupiter swap structure");
    }

        return {
            trackedWallet: this.trackedWallet,
            type: TransactionType.SWAP,
            platform: SwapPlatform.JUPITER,
            signature: data.signature,
            timestamp: data.timestamp || Date.now(),
            status: data.transactionError ? "FAILED" : "SUCCESS",
            inputToken: {
                mint: input.mint,
                amount: input.tokenAmount,
                decimals: this.getTokenDecimals(data, input.mint),
                address: input.fromUserAccount
            },
            outputToken: {
                mint: output.mint,
                amount: output.tokenAmount,
                decimals: this.getTokenDecimals(data, output.mint),
                address: output.toUserAccount
            },
            fee: data.fee
        };
    }
}
