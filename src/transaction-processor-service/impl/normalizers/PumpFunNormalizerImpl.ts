import { SwapTransactionDTO } from "../../dto/TransactionDTO";
import { SwapPlatform, TransactionType } from "../../enum/TransactionEnum";
import { BaseNormalizerImpl } from "./BaseNormalizerImpl";

interface WebhookData {
  accountData: {
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: {
      mint: string;
      rawTokenAmount: {
        decimals: number;
        tokenAmount: string;
      };
      tokenAccount: string;
      userAccount: string;
    }[];
  }[];
  tokenTransfers: {
    fromTokenAccount: string;
    fromUserAccount: string;
    toTokenAccount: string;
    toUserAccount: string;
    mint: string;
    tokenAmount: number;
    tokenStandard: string;
  }[];
  nativeTransfers: {
    amount: number;
    fromUserAccount: string;
    toUserAccount: string;
  }[];
  signature: string;
  timestamp: number;
  source: string;
  fee: number;
  type: string;
  transactionError: any;
}

export class PumpFunNormalizerImpl extends BaseNormalizerImpl {
  canHandle(data: WebhookData): boolean {
    return data.source === "PUMP_FUN";
  }

  private calculateSolAmount(data: WebhookData): number {
    // Encontra a mudança total de SOL para a carteira rastreada
    const userAccountData = data.accountData.find(
      (acc) => acc.account === this.trackedWallet
    );

    if (!userAccountData) return 0;

    // Quando recebemos SOL (venda), o nativeBalanceChange será positivo
    return userAccountData.nativeBalanceChange > 0
      ? (userAccountData.nativeBalanceChange - data.fee) / 1e9 // Converte lamports para SOL
      : Math.abs(userAccountData.nativeBalanceChange + data.fee) / 1e9;
  }

  normalize(data: WebhookData): SwapTransactionDTO {
    const tokenTransfer = data.tokenTransfers[0];
    const solAmount = this.calculateSolAmount(data);
    const isUserSelling = tokenTransfer.fromUserAccount === this.trackedWallet;

    // Log para debug
    console.log("🎮 PumpFun transaction detected!");

    if (isUserSelling) {
      // Vendendo MEME por SOL
      return {
        type: TransactionType.SWAP,
        platform: SwapPlatform.PUMP_FUN,
        signature: data.signature,
        timestamp: data.timestamp,
        status: data.transactionError ? "FAILED" : "SUCCESS",
        inputToken: {
          mint: tokenTransfer.mint,
          amount: tokenTransfer.tokenAmount,
          address: tokenTransfer.fromUserAccount,
        },
        outputToken: {
          mint: "So11111111111111111111111111111111111111112", // SOL mint address
          amount: solAmount,
          address: this.trackedWallet,
        },
        fee: data.fee,
      };
    }

<<<<<<< HEAD
    private calculateSolAmount(data: WebhookData): number {
        // Encontra a mudança total de SOL para a carteira rastreada
        const userAccountData = data.accountData.find(acc => 
            acc.account === this.trackedWallet
        );
        
        if (!userAccountData) return 0;

        // Quando recebemos SOL (venda), o nativeBalanceChange será positivo
        return userAccountData.nativeBalanceChange > 0 
            ? (userAccountData.nativeBalanceChange - data.fee) / 1e9 // Converte lamports para SOL
            : Math.abs(userAccountData.nativeBalanceChange + data.fee) / 1e9;
    }

    normalize(data: WebhookData): SwapTransactionDTO {
        const tokenTransfer = data.tokenTransfers[0];
        const solAmount = this.calculateSolAmount(data);
        const isUserSelling = tokenTransfer.fromUserAccount === this.trackedWallet;

        // Log para debug
        console.log("🎮 PumpFun transaction detected!");

        if (isUserSelling) {
            // Vendendo MEME por SOL
            return {
                trackedWallet: this.trackedWallet,
                type: TransactionType.SWAP,
                platform: SwapPlatform.PUMP_FUN,
                signature: data.signature,
                timestamp: data.timestamp,
                status: data.transactionError ? "FAILED" : "SUCCESS",
                inputToken: {
                    mint: tokenTransfer.mint,
                    amount: tokenTransfer.tokenAmount,
                    address: tokenTransfer.fromUserAccount
                },
                outputToken: {
                    mint: "So11111111111111111111111111111111111111112", // SOL mint address
                    amount: solAmount,
                    address: this.trackedWallet
                },
                fee: data.fee
            };
        }
        
        // Comprando MEME com SOL
        return {
            trackedWallet: this.trackedWallet,
            type: TransactionType.SWAP,
            platform: SwapPlatform.PUMP_FUN,
            signature: data.signature,
            timestamp: data.timestamp,
            status: data.transactionError ? "FAILED" : "SUCCESS",
            inputToken: {
                mint: "So11111111111111111111111111111111111111112",
                amount: solAmount,
                address: this.trackedWallet
            },
            outputToken: {
                mint: tokenTransfer.mint,
                amount: tokenTransfer.tokenAmount,
                address: tokenTransfer.toUserAccount
            },
            fee: data.fee
        };
    }
}
=======
    // Comprando MEME com SOL
    return {
      type: TransactionType.SWAP,
      platform: SwapPlatform.PUMP_FUN,
      signature: data.signature,
      timestamp: data.timestamp,
      status: data.transactionError ? "FAILED" : "SUCCESS",
      inputToken: {
        mint: "So11111111111111111111111111111111111111112",
        amount: solAmount,
        address: this.trackedWallet,
      },
      outputToken: {
        mint: tokenTransfer.mint,
        amount: tokenTransfer.tokenAmount,
        address: tokenTransfer.toUserAccount,
      },
      fee: data.fee,
    };
  }
}
>>>>>>> feature/percentage-per-trade
