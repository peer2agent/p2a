import { TransactionType } from "helius-sdk";
import { SwapTransactionDTO, TransferTransactionDTO } from "../../transaction-processor-service/dto/TransactionDTO";
import { TransactionProcessorImpl } from "../../transaction-processor-service/impl/TransactionProcessorImpl";
import { PublicKey } from "@solana/web3.js";
import { RealiseSwapByPDAUseCase } from "./RealiseSwapByPDAUseCase";
import { JupiterImpl } from "../../trade-token-service/impl/JupiterSwapImpl";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { WalletDTO } from "../../wallet-tracker-service/dto/WalletDTO";
import { junit } from "node:test/reporters";
import { JupiterClientSwap } from "../../trade-token-service/client/JupiterClientSwap";

export class TransactionProcessorUseCase {
    private processor: TransactionProcessorImpl;

    constructor(trackedWallet: string) {
        this.processor = new TransactionProcessorImpl(trackedWallet);
    }

    async processWebhook(webhookData: any): Promise<void> {
        try {
            
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
        
        } catch (error) {
            console.log("Error processing webhook", error)
            
        }}

    private async handleSwap(swap: SwapTransactionDTO): Promise<void> {

        try {
            
            console.log(`Processing ${swap.platform} swap for wallet: ${swap.trackedWallet}`)
            console.log(`Processing ${swap.platform} swap:`);
            console.log(`Input: ${swap.inputToken.amount} ${swap.inputToken.mint}`);
            console.log(`Output: ${swap.outputToken.amount} ${swap.outputToken.mint}`);
            

            const realiseSwapByPDAUseCase = new RealiseSwapByPDAUseCase()
            
            const solToken = "So11111111111111111111111111111111111111112";
            
            // Verify input and output tokens
            const jupiter = new JupiterClientSwap(false);
            
            // Check if we need to route through SOL token
            let inputTokenToUse = swap.inputToken.mint;
            let outputTokenToUse = swap.outputToken.mint;
            
            // If neither token is SOL, we need to:
            // 1. First swap SOL -> input token
            // 2. Then swap input token -> output token
            if (swap.inputToken.mint !== solToken && swap.outputToken.mint !== solToken) {
                console.log("Neither token is SOL, routing through SOL first");
                inputTokenToUse = solToken;
            }
            

            const outputMintTokenAddress = new PublicKey(inputTokenToUse)
        
            const inputMintTokenAddress= new PublicKey(outputTokenToUse)

            await realiseSwapByPDAUseCase.execute(new PublicKey(swap.trackedWallet),swap.inputToken.amount,inputMintTokenAddress,outputMintTokenAddress)

            console.log("Copy trade realized successfully")
        } catch (error) {
            console.log("Error processing swap", error)
        }

    }

    private async handleTransfer(transfer: TransferTransactionDTO): Promise<void> {
        console.log(`Processing transfer:`);
        console.log(`Processing swap for wallet: ${transfer.trackedWallet}`)
        console.log(`From: ${transfer.fromAddress}`);
        console.log(`To: ${transfer.toAddress}`);
        console.log(`Amount: ${transfer.token.amount} ${transfer.token.mint}`);
    }


}