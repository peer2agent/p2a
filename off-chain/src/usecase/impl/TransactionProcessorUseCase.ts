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
              const jupiter = new JupiterClientSwap(false);
              const swapper = new RealiseSwapByPDAUseCase();
              const wallet  = new PublicKey(swap.trackedWallet);
              const solMint = new PublicKey("So11111111111111111111111111111111111111112");
              const inMint  = new PublicKey(swap.inputToken.mint);
              const outMint = new PublicKey(swap.outputToken.mint);
              const sellAmt = swap.inputToken.amount;
              const buyAmt  = swap.outputToken.amount;
          
              // fetch balances
              const inBal  = await jupiter.getSPLTokenBalance(wallet, inMint);
              const outBal = await jupiter.getSPLTokenBalance(wallet, outMint);
          
              let routeFrom: PublicKey;
              let routeTo:   PublicKey;
          
              if (inBal >= sellAmt && outBal >= buyAmt) {
                // both tokens present → exact swap
                routeFrom = inMint;
                routeTo   = outMint;
          
              } else if (inBal >= sellAmt) {
                // only input present → input→output
                routeFrom = inMint;
                routeTo   = outMint;
          
              } else if (outBal >= buyAmt) {
                // only output present → reverse: output→input
                routeFrom = outMint;
                routeTo   = inMint;
          
              } else {
                // neither present → fall back to SOL trades
                // decide if original was a “buy output” or “sell input”
                const originalWasBuy = sellAmt > 0 && buyAmt > 0;
                if (originalWasBuy) {
                  routeFrom = solMint;
                  routeTo   = outMint;
                } else {
                  routeFrom = solMint;
                  routeTo   = inMint;
                }
              }
          
              console.log(`Routing trade ${routeFrom.toBase58()} → ${routeTo.toBase58()} for ${sellAmt}`);
              await swapper.execute(wallet, sellAmt, routeFrom, routeTo);
              console.log("Copy trade realized successfully");
          
            } catch (err) {
              console.error("Error processing swap", err);
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