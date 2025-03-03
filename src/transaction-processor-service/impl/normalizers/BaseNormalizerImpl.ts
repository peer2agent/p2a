import {
  SwapTransactionDTO,
  TransferTransactionDTO,
} from "../../dto/TransactionDTO";

export abstract class BaseNormalizerImpl {
  protected trackedWallet: string;

  constructor(trackedWallet: string) {
    this.trackedWallet = trackedWallet;
  }

  abstract canHandle(data: any): boolean;
  abstract normalize(data: any): SwapTransactionDTO | TransferTransactionDTO;
}
