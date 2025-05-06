import { PublicKey } from "@solana/web3.js";
import { PDAImpl } from "../../smart-contract-service/impl/PDAImpl";
import { JupiterClientSwap } from "../../trade-token-service/client/JupiterClientSwap";

export class RealiseSwapByPDAUseCase {

    async execute(publicKey: PublicKey, amount: number, inputMintTokenAddress: PublicKey, outputMintTokenAddress:PublicKey): Promise<string> {
        
        if (amount <= 0) {
            throw new Error("Amount must be greater than zero");
        }

        try {
            
            const pdaImpl = new PDAImpl();

            const listOfFollowers = await pdaImpl.getFollowersByTrader(publicKey)

            const jupiterClient = new JupiterClientSwap(pdaImpl.connection, false);
            
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
                    publicKey, 
                    swapTransaction
                );

                console.log("Swap executed successfully. TX signature:", txSignature);
            }))
            

            return "Trade Realizado";

        } catch (error) {
            console.error("Error in RealiseSwapByPDAUseCase:", error);
            throw new Error(`Failed to execute swap: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}