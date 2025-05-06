import { TransactionType } from "helius-sdk";
import { SwapTransactionDTO, TransferTransactionDTO } from "../../transaction-processor-service/dto/TransactionDTO";
import { TransactionProcessorImpl } from "../../transaction-processor-service/impl/TransactionProcessorImpl";
import { PublicKey } from "@solana/web3.js";
import { RealiseSwapByPDAUseCase } from "./RealiseSwapByPDAUseCase";

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

            const outputMintTokenAddress = new PublicKey(swap.outputToken.mint)
            
            const inputMintTokenAddress= new PublicKey(swap.inputToken.mint)

            //TODO NOYMA VAI APLICAR A LOGICA PARA EXTRAIR O VALOR PARA O TRADE
            
            var amount =  500

            await realiseSwapByPDAUseCase.execute(new PublicKey(swap.trackedWallet),amount,inputMintTokenAddress,outputMintTokenAddress)
        
        
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