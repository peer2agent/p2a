import {
  SwapTransactionDTO,
  TransferTransactionDTO,
} from "../dto/TransactionDTO";
import { SwapPlatform, TransactionType } from "../enum/TransactionEnum";
import { BaseNormalizerImpl } from "./normalizers/BaseNormalizerImpl";
import { JupiterNormalizerImpl } from "./normalizers/JupiterNormalizerImpl";
import { MeteoraImpl } from "./normalizers/MeteoraNormalizerImpl";
import { OrcaNormalizerImpl } from "./normalizers/OrcaNomalizerImpl";
import { PumpFunNormalizerImpl } from "./normalizers/PumpFunNormalizerImpl";
import { RaydiumNormalizerImpl } from "./normalizers/RaydiumNormalizerImpl";
import { TransferNormalizerImpl } from "./normalizers/TransferNormalizerImpl";

interface WebhookTokenTransfer {
  fromTokenAccount: string;
  fromUserAccount: string;
  toTokenAccount: string;
  toUserAccount: string;
  mint: string;
  tokenAmount: number;
  tokenStandard: string;
}

interface WebhookData {
  type?: string;
  feePayer?: string;
  source?: string;
  signature: string;
  timestamp?: number;
  transactionError?: any;
  tokenTransfers: WebhookTokenTransfer[];
  accountData?: {
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
  fee?: number;
  slot?: number;
  nativeTransfers?: {
    amount: number;
    fromUserAccount: string;
    toUserAccount: string;
  }[];
}

export class TransactionProcessorImpl {
  private trackedWallet: string  = "";
  private readonly normalizers: BaseNormalizerImpl[];

  constructor() {
    this.normalizers = [
      new JupiterNormalizerImpl(),
      new PumpFunNormalizerImpl(),
      new RaydiumNormalizerImpl(),
      new OrcaNormalizerImpl(),
      new MeteoraImpl(),
      new TransferNormalizerImpl(),
    ];
  }

  /**
   * Identifica a plataforma de onde a transação veio.
   */
  private identifyPlatform(data: WebhookData): SwapPlatform {
    if (data.source) {
      switch (data.source.toUpperCase()) {
        case "JUPITER":
          return SwapPlatform.JUPITER;
        case "RAYDIUM":
          return SwapPlatform.RAYDIUM;
        case "PUMP_FUN":
          return SwapPlatform.PUMP_FUN;
        case "ORCA":
          return SwapPlatform.ORCA;
        case "METEORA":
          return SwapPlatform.METEORA;
      }
    }

    return SwapPlatform.UNKNOWN;
  }

  /**
   * Retorna a quantidade de decimais de um token específico dentro da transação.
   */
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

  /**
   * Normaliza uma transação de SWAP, garantindo que os tokens de entrada e saída sejam corretamente definidos.
   */
  private normalizeSwap(data: WebhookData): SwapTransactionDTO {
    this.trackedWallet = data.feePayer!!
    const platform = this.identifyPlatform(data);
    const transfers = data.tokenTransfers;

    const input = transfers.find(
      (t) =>
        t.fromUserAccount === this.trackedWallet &&
        !transfers.some(
          (tt) => tt.toUserAccount === this.trackedWallet && tt.mint === t.mint
        )
    );

    const output = transfers.find(
      (t) =>
        t.toUserAccount === this.trackedWallet &&
        !transfers.some(
          (tt) =>
            tt.fromUserAccount === this.trackedWallet && tt.mint === t.mint
        )
    );

    if (!input || !output) {
      throw new Error("Invalid swap structure");
    }

        return {
            trackedWallet: this.trackedWallet, 
            type: TransactionType.SWAP,
            platform,
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

  /**
   * Normaliza uma transação de TRANSFERÊNCIA.
   */
  private processTransfer(data: WebhookData): TransferTransactionDTO {
    const transfer = data.tokenTransfers[0];

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
                decimals: this.getTokenDecimals(data, transfer.mint)
            },
            fee: data.fee
        };
    }

  /**
   * Verifica se a transação pode ser classificada como um SWAP.
   */
  private isSwap(data: WebhookData): boolean {
    if (data.type?.toUpperCase() === "SWAP") return true;

    const transfers = data.tokenTransfers;
    if (transfers.length < 2) return false;

    const uniqueMints = new Set(transfers.map((t) => t.mint));
    const hasInAndOut =
      transfers.some((t) => t.fromUserAccount === this.trackedWallet) &&
      transfers.some((t) => t.toUserAccount === this.trackedWallet);

    return uniqueMints.size > 1 && hasInAndOut;
  }

  /**
   * Verifica se a transação pode ser classificada como uma TRANSFERÊNCIA.
   */
  private isTransfer(data: WebhookData): boolean {
    return (
      data.type?.toUpperCase() === "TRANSFER" ||
      data.tokenTransfers?.length === 1
    );
  }

  /**
   * Processa a transação e determina se é um SWAP ou uma TRANSFERÊNCIA.
   */
  public processTransaction(
    webhookData: WebhookData[]
  ): SwapTransactionDTO | TransferTransactionDTO | undefined {
    const data = webhookData[0];
    console.log("data ->", data)
    if (!data) return undefined;

    // Verifica se há um normalizador adequado
    for (const normalizer of this.normalizers) {
      try {
        if (normalizer.canHandle(data)) {
          return normalizer.normalize(data);
        }
      } catch (error) {
        console.error(`Erro no normalizador: ${error}`);
      }
    }

    // Caso nenhum normalizador consiga processar, tenta determinar manualmente
    if (this.isSwap(data)) {
      return this.normalizeSwap(data);
    }

    if (this.isTransfer(data)) {
      return this.processTransfer(data);
    }

    try {
      return this.normalizeSwap(data)

    } catch (error) {
      console.error(`Erro ao processar transação: ${error}`);
      return this.processTransfer(data);

    }
  }
}