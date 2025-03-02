import { TransactionType } from "helius-sdk";
import { TransactionProcessorImpl } from "../impl/TransactionProcessorImpl";
import { SwapTransactionDTO, TransferTransactionDTO } from "../dto/TransactionDTO";

export class TransactionProcessorClient {
    private processor: TransactionProcessorImpl;

    constructor(trackedWallet: string) {
        this.processor = new TransactionProcessorImpl(trackedWallet);
    }

    async processWebhook(webhookData: any): Promise<void> {
        const transaction = this.processor.processTransaction(webhookData);
        
        if (!transaction) {
            console.log("Unknown transaction type");
            return;
        }

        if (transaction.type === TransactionType.SWAP) {
            await this.handleSwap(transaction);
        } else {
            await this.handleTransfer(transaction);
        }
    }

    private async handleSwap(swap: SwapTransactionDTO): Promise<void> {
        console.log(`Processing ${swap.platform} swap for wallet: ${swap.trackedWallet}`);
        console.log(`Input: ${swap.inputToken.amount} ${swap.inputToken.mint}`);
        console.log(`Output: ${swap.outputToken.amount} ${swap.outputToken.mint}`);
    }

    private async handleTransfer(transfer: TransferTransactionDTO): Promise<void> {
        console.log(`Processing transfer for wallet: ${transfer.trackedWallet}`);
        console.log(`From: ${transfer.fromAddress}`);
        console.log(`To: ${transfer.toAddress}`);
        console.log(`Amount: ${transfer.token.amount} ${transfer.token.mint}`);
    }
}