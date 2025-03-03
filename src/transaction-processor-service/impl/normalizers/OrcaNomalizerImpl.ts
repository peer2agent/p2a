import { SwapTransactionDTO } from "../../dto/TransactionDTO";
import { SwapPlatform, TransactionType } from "../../enum/TransactionEnum";
import { BaseNormalizerImpl } from "./BaseNormalizerImpl";

interface TokenTransfer {
  fromTokenAccount: string;
  fromUserAccount: string;
  toTokenAccount: string;
  toUserAccount: string;
  mint: string;
  tokenAmount: number;
  tokenStandard: string;
}

interface WebhookData {
  source?: string;
  tokenTransfers: TokenTransfer[];
  signature: string;
  timestamp?: number;
  transactionError?: any;
  fee?: number;
  instructions?: {
    programId: string;
  }[];
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

export class OrcaNormalizerImpl extends BaseNormalizerImpl {
  // Lista de program IDs conhecidos da Orca
  private readonly ORCA_PROGRAM_IDS = [
    "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", // Whirlpool
    "DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1", // Orca v1
    "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP", // Orca v2
  ];

  canHandle(data: WebhookData): boolean {
    return (
      data.instructions?.some((instruction) =>
        this.ORCA_PROGRAM_IDS.includes(instruction.programId)
      ) || data.source === "ORCA"
    );
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
    const transfers = data.tokenTransfers;

    const transfersByMint = transfers.reduce((acc, transfer) => {
      const mint = transfer.mint;
      if (!acc[mint]) {
        acc[mint] = [];
      }
      acc[mint].push(transfer);
      return acc;
    }, {} as Record<string, TokenTransfer[]>);

    const netBalances = Object.entries(transfersByMint).map(
      ([mint, transfers]) => {
        const netAmount = transfers.reduce((sum, transfer) => {
          if (transfer.fromUserAccount === this.trackedWallet) {
            return sum - transfer.tokenAmount;
          }
          if (transfer.toUserAccount === this.trackedWallet) {
            return sum + transfer.tokenAmount;
          }
          return sum;
        }, 0);
        return { mint, netAmount };
      }
    );

    const input = netBalances.find((balance) => balance.netAmount < 0);
    const output = netBalances.find((balance) => balance.netAmount > 0);

    if (!input || !output) {
      throw new Error("Invalid Orca swap structure");
    }

    console.log("💧 Orca swap detected!");

        return {
            trackedWallet: this.trackedWallet,
            type: TransactionType.SWAP,
            platform: SwapPlatform.ORCA,
            signature: data.signature,
            timestamp: data.timestamp || Date.now(),
            status: data.transactionError ? "FAILED" : "SUCCESS",
            inputToken: {
                mint: input.mint,
                amount: Math.abs(input.netAmount),
                decimals: this.getTokenDecimals(data, input.mint),
                address: this.trackedWallet
            },
            outputToken: {
                mint: output.mint,
                amount: output.netAmount,
                decimals: this.getTokenDecimals(data, output.mint),
                address: this.trackedWallet
            },
            fee: data.fee
        };
    }
}
