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

interface WebhookData {
    source?: string;
    tokenTransfers: TokenTransfer[];
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

export class RaydiumNormalizerImpl extends BaseNormalizerImpl {
    canHandle(data: WebhookData): boolean {
        return data.source === "RAYDIUM";
    }

    private getTokenDecimals(data: WebhookData, mint: string): number | undefined {
        const tokenChange = data.accountData?.find(account => 
            account.tokenBalanceChanges?.some(change => change.mint === mint)
        )?.tokenBalanceChanges.find(change => change.mint === mint);

        return tokenChange?.rawTokenAmount.decimals;
    }

    normalize(data: WebhookData): SwapTransactionDTO {
        const transfers = data.tokenTransfers;
        
        console.log("📻 Radyum transaction detected!");


        const input = transfers.find(t => t.fromUserAccount === this.trackedWallet);
    
        if (!input) {
            throw new Error("Invalid Raydium swap structure: No input found");
        }

        const output = [...transfers].reverse().find(t => 
            t.toUserAccount === this.trackedWallet && t.mint !== input.mint
        );

        if (!output) {
            throw new Error("Invalid Raydium swap structure: No output found");
        }

        return {
            type: TransactionType.SWAP,
            platform: SwapPlatform.RAYDIUM,
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