import { SwapTransactionDTO } from "../../dto/TransactionDTO";
import { SwapPlatform, TransactionType } from "../../enum/TransactionEnum";
import { BaseNormalizerImpl } from "./BaseNormalizerImpl";

interface WebhookData {
  source?: string;
  feePayer?: string;
  tokenTransfers: {
    fromUserAccount: string;
    toUserAccount: string;
    mint: string;
    tokenAmount: number;
  }[];
  instructions?: {
    programId: string;
  }[];
  signature: string;
  timestamp?: number;
  transactionError?: any;
  fee?: number;
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

export class MeteoraImpl extends BaseNormalizerImpl {
  // Program ID da Meteora
  private readonly METEORA_PROGRAM_ID =
    "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo";

  canHandle(data: WebhookData): boolean {
    return data.instructions
      ? data.instructions.some(
          (instruction) => instruction.programId === this.METEORA_PROGRAM_ID
        )
      : false;
  }

  private getTokenDecimals(
    data: WebhookData,
    mint: string
  ): number | undefined {
    const tokenChange = data.accountData
      ?.find((account) =>
        account.tokenBalanceChanges.some((change) => change.mint === mint)
      )
      ?.tokenBalanceChanges.find((change) => change.mint === mint);

    return tokenChange?.rawTokenAmount.decimals;
  }

  normalize(data: WebhookData): SwapTransactionDTO {
    console.log("🌠 Meteora swap detected!");

    const input = data.tokenTransfers.find(
      (t) => t.fromUserAccount === this.trackedWallet
    );

    const output = data.tokenTransfers.find(
      (t) => t.toUserAccount === this.trackedWallet
    );

    if (!input || !output) {
      throw new Error("Invalid Meteora swap structure");
    }

        return {
            trackedWallet: this.trackedWallet,
            type: TransactionType.SWAP,
            platform: SwapPlatform.METEORA,
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
