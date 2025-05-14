import { PublicKey } from "@solana/web3.js";
import { PDAImpl } from "../../smart-contract-service/impl/PDAImpl";
import { JupiterClientSwap } from "../../trade-token-service/client/JupiterClientSwap";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { InputSwapDTO } from "../../trade-token-service/dto/InputSwapDTO";
import { WalletDTO } from "../../wallet-tracker-service/dto/WalletDTO";

export class RealiseSwapByPDAUseCase {

    async execute(traderPublicKey: PublicKey,inputTokenAmount:number, inputMintTokenAddress: PublicKey, outputMintTokenAddress:PublicKey): Promise<string> {

        const amount = await this.calculateAmount(traderPublicKey,inputTokenAmount)
        
        if (amount <= 0) {
            throw new Error("Amount must be greater than zero");
        }

        try {
            
            const pdaImpl = new PDAImpl();

            const listOfFollowers = await pdaImpl.getFollowersByTrader(traderPublicKey)

            const jupiterClient = new JupiterClientSwap(false);
            
            console.log("Fetching swap info...");

            const swapInfo = await jupiterClient.fetchSwapInfo(
                inputMintTokenAddress.toString(),
                outputMintTokenAddress.toString(),
                amount
            );

            console.log(listOfFollowers)
            
            await Promise.all(listOfFollowers.map(async (pubkey) =>{
                
                const {swapTransaction, lastValidBlockHeight} = await jupiterClient.fetchSwapTransaction(new PublicKey(pubkey),swapInfo)

                console.log("Executing swap via PDA...");
                
                const txSignature = await pdaImpl.executeSwapPDA(
                    pubkey, 
                    swapTransaction
                );

                console.log("Swap executed successfully. TX signature:", txSignature);

                await pdaImpl.transferSol(new PublicKey(pubkey), amount, traderPublicKey)

                console.log("Transfer of SOL to trader executed successfully")
            }))
            
            return "Trade Realizado";

        } catch (error) {
            console.error("Error in RealiseSwapByPDAUseCase:", error);
            throw new Error(`Failed to execute swap: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async calculateAmount(traderPublicKey: PublicKey, inputTokenAmount:number): Promise<number> {

        try {
            const jupiter = new JupiterClientSwap(false)
        
        
            const trackedWallet = new WalletTrackerImpl()
    
            await trackedWallet.createWebhook(
                [traderPublicKey.toString()]
            )
    
            const distribution = await trackedWallet.getDistribution(traderPublicKey.toString())
    
            const percentage = this.selectMode(distribution, inputTokenAmount)
    
            const myBalance = await jupiter.getBalance(new PublicKey(traderPublicKey.toString()))
    
            var amount =  myBalance * percentage
    
            return amount
            
        } catch (error) {
            console.error("error:",error)
            throw error
        }
    
    }

    public selectMode(distribution:WalletDTO, tokenPercentage:number): number {
        var balance = distribution.usdBalance

        switch (true) {
            case balance >= 50_000:
                console.log("balance >= 50_000")
                return 0.1
            case balance < 50_000 && balance >=10_000:
                console.log("balance >= 10_000")
                return 0.05
            default:
                console.log("balance menor")
                return tokenPercentage
        }
    }
}