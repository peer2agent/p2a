import { TransferTransactionDTO } from "../../dto/TransactionDTO";
import { TransactionType } from "../../enum/TransactionEnum";
import { BaseNormalizerImpl } from "./BaseNormalizerImpl";

interface WebhookData {
  source?: string;
  tokenTransfers: {
    fromUserAccount: string;
    toUserAccount: string;
    mint: string;
    tokenAmount: number;
  }[];
  nativeTransfers: {
    amount: number;
    fromUserAccount: string;
    toUserAccount: string;
  }[];
  signature: string;
  timestamp?: number;
  transactionError?: any;
  fee?: number;
  type?: string;
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

export class TransferNormalizerImpl extends BaseNormalizerImpl {
  canHandle(data: WebhookData): boolean {
    return data.type === "TRANSFER";
  }

  normalize(data: WebhookData): TransferTransactionDTO {
    if (this.isNativeSOLTransfer(data)) {
      return this.normalizeSOLTransfer(data);
    }
    return this.normalizeTokenTransfer(data);
  }

  private isNativeSOLTransfer(data: WebhookData): boolean {
    return (
      data.source === "SYSTEM_PROGRAM" &&
      data.nativeTransfers?.length > 0 &&
      data.tokenTransfers?.length === 0
    );
  }

  private normalizeSOLTransfer(data: WebhookData): TransferTransactionDTO {
    const transfer = data.nativeTransfers[0];

    console.log("💸 SOL Transfer detected!");
    console.log("From:", transfer.fromUserAccount);
    console.log("To:", transfer.toUserAccount);
    console.log("Amount:", transfer.amount / 1e9, "SOL");

    return {
      type: TransactionType.TRANSFER,
      signature: data.signature,
      timestamp: data.timestamp || Date.now(),
      status: data.transactionError ? "FAILED" : "SUCCESS",
      fromAddress: transfer.fromUserAccount,
      toAddress: transfer.toUserAccount,
      token: {
        mint: "So11111111111111111111111111111111111111112",
        amount: transfer.amount / 1e9,
        decimals: 9,
      },
      fee: data.fee,
    };
  }

<<<<<<< HEAD
        return {
            trackedWallet: this.trackedWallet,
            type: TransactionType.TRANSFER,
            signature: data.signature,
            timestamp: data.timestamp || Date.now(),
            status: data.transactionError ? "FAILED" : "SUCCESS",
            fromAddress: transfer.fromUserAccount,
            toAddress: transfer.toUserAccount,
            token: {
                mint: "So11111111111111111111111111111111111111112",
                amount: transfer.amount / 1e9,
                decimals: 9
            },
            fee: data.fee
        };
    }
=======
  private normalizeTokenTransfer(data: WebhookData): TransferTransactionDTO {
    const transfer = data.tokenTransfers[0];
>>>>>>> feature/percentage-per-trade

    const tokenChange = data.accountData
      ?.find((acc) =>
        acc.tokenBalanceChanges?.some((change) => change.mint === transfer.mint)
      )
      ?.tokenBalanceChanges?.find((change) => change.mint === transfer.mint);

    console.log("🔄 Token Transfer detected!");
    console.log("Token:", transfer.mint);
    console.log("Amount:", transfer.tokenAmount);

<<<<<<< HEAD
        return {
            trackedWallet: this.trackedWallet,
            type: TransactionType.TRANSFER,
            signature: data.signature,
            timestamp: data.timestamp || Date.now(),
            status: data.transactionError ? "FAILED" : "SUCCESS",
            fromAddress: transfer.fromUserAccount,
            toAddress: transfer.toUserAccount,
            token: {
                mint: transfer.mint,
                amount: transfer.tokenAmount,
                decimals: tokenChange?.rawTokenAmount.decimals
            },
            fee: data.fee
        };
    }
}
=======
    return {
      type: TransactionType.TRANSFER,
      signature: data.signature,
      timestamp: data.timestamp || Date.now(),
      status: data.transactionError ? "FAILED" : "SUCCESS",
      fromAddress: transfer.fromUserAccount,
      toAddress: transfer.toUserAccount,
      token: {
        mint: transfer.mint,
        amount: transfer.tokenAmount,
        decimals: tokenChange?.rawTokenAmount.decimals,
      },
      fee: data.fee,
    };
  }
}
>>>>>>> feature/percentage-per-trade
