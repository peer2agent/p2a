import { PublicKey } from "@solana/web3.js";
import { PDAImpl } from "../../smart-contract-service/impl/PDAImpl";
import { JupiterClientSwap } from "../../trade-token-service/client/JupiterClientSwap";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { InputSwapDTO } from "../../trade-token-service/dto/InputSwapDTO";
import { WalletDTO } from "../../wallet-tracker-service/dto/WalletDTO";

export class RealiseSwapByPDAUseCase {
    private pdaImpl: PDAImpl

    constructor() {
        this.pdaImpl = new PDAImpl();
    }

    async execute(traderPublicKey: PublicKey,inputTokenAmount:number, inputMintTokenAddress: PublicKey, outputMintTokenAddress:PublicKey): Promise<string> {

        
        try {
            
            const listOfFollowers = await this.pdaImpl.getFollowersByTrader(traderPublicKey)
            
            const jupiterClient = new JupiterClientSwap(false);
            
            console.log("Fetching swap info...");
             
            await Promise.all(listOfFollowers.map(async (pubkey) =>{
                
                const amount = await this.calculateAmount(new PublicKey(pubkey),traderPublicKey,inputTokenAmount)
                
                if (amount <= 0) {
                    throw new Error("Amount must be greater than zero");
                }
    
                const swapInfo = await jupiterClient.fetchSwapInfo(
                    inputMintTokenAddress.toString(),
                    outputMintTokenAddress.toString(),
                    amount
                );
                const {swapTransaction, lastValidBlockHeight} = await jupiterClient.fetchSwapTransaction(new PublicKey(pubkey),swapInfo)

                console.log("Executing swap via PDA...");
                
                const txSignature = await this.pdaImpl.executeSwapPDA(
                    pubkey, 
                    swapTransaction
                );

                console.log("Swap executed successfully. TX signature:", txSignature);

                await this.pdaImpl.transferSol(new PublicKey(pubkey), amount, traderPublicKey)

                console.log("Transfer of SOL to trader executed successfully")
            }))
            
            return "Trade Realizado";

        } catch (error) {
            console.error("Error in RealiseSwapByPDAUseCase:", error);
            throw new Error(`Failed to execute swap: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async calculateAmount(followPublicKey: PublicKey,traderPublicKey: PublicKey, inputTokenAmount:number): Promise<number> {

        try {
            
            const trackedWallet = new WalletTrackerImpl()
    
            await trackedWallet.createWebhook(
                [traderPublicKey.toString()]
            )
    
            const distribution = await trackedWallet.getDistribution(traderPublicKey.toString())
    
            const percentage = this.selectMode(distribution, inputTokenAmount)
    
            const pote = await this.pdaImpl.getPoteBalance(followPublicKey)
    
            var amount =  pote * percentage
    
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