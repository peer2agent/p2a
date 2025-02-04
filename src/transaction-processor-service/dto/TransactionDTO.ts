import { TransactionType } from "helius-sdk";
import { SwapPlatform } from "../enum/TransactionEnum";

export interface TokenDataDTO {
    mint: string;
    amount: number;
    decimals?: number;
    symbol?: string;
}

export interface BaseTransactionDTO {
    signature: string;
    timestamp: number;
    status: "SUCCESS" | "FAILED";
    fee?: number;
}

export interface SwapTransactionDTO extends BaseTransactionDTO {
    type: TransactionType.SWAP;
    platform: SwapPlatform;
    inputToken: TokenDataDTO & { address: string };
    outputToken: TokenDataDTO & { address: string };
}

export interface TransferTransactionDTO extends BaseTransactionDTO {
    type: TransactionType.TRANSFER;
    fromAddress: string;
    toAddress: string;
    token: TokenDataDTO;
}