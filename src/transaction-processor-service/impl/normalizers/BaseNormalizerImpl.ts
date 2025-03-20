import {
  SwapTransactionDTO,
  TransferTransactionDTO,
} from "../../dto/TransactionDTO";

export abstract class BaseNormalizerImpl {
  
  abstract canHandle(data: any): boolean;
  abstract normalize(data: any): SwapTransactionDTO | TransferTransactionDTO;
}
