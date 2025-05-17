import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { PDAImpl } from "../../smart-contract-service/impl/PDAImpl";
import { JupiterClientSwap } from "../../trade-token-service/client/JupiterClientSwap";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { WalletDTO } from "../../wallet-tracker-service/dto/WalletDTO";

export class RealiseSwapByPDAUseCase {
    private pdaImpl: PDAImpl

    constructor() {
        this.pdaImpl = new PDAImpl();
    }

    async execute(traderPublicKey: PublicKey, inputTokenAmount:number, inputMintTokenAddress: PublicKey, outputMintTokenAddress:PublicKey): Promise<string> {
        try {
            console.log("🔄 Initiating PDA swap process...")
            console.log("   Trader:", traderPublicKey.toString())
            console.log("   Input token:", inputMintTokenAddress.toString())
            console.log("   Output token:", outputMintTokenAddress.toString())
            console.log("   Amount:", inputTokenAmount)
            
            const listOfFollowers = await this.pdaImpl.getFollowersByTrader(traderPublicKey)
            console.log("👥 Found followers:", listOfFollowers.length)
            
            const jupiterClient = new JupiterClientSwap(false);
            console.log("🌟 Jupiter client initialized")
            
            console.log("📊 Processing swaps for followers...")
            const results = await Promise.all(listOfFollowers.map(async (pubkey) => {
                console.log("\n🔄 Processing follower:", pubkey)
                
                const amount = await this.calculateAmount(new PublicKey(pubkey), traderPublicKey, inputTokenAmount)
                console.log("   Calculated amount:", amount)
                
                if (amount <= 0) {
                    console.warn("⚠️ Skipping follower - Amount too low")
                    throw new Error("Amount must be greater than zero");
                }
    
                // Convert amount to lamports before sending to Jupiter
                const amountInLamports = Math.floor(amount * LAMPORTS_PER_SOL);
                console.log("   Amount in lamports:", amountInLamports)
    
                console.log("   Fetching swap info from Jupiter...")
                const swapInfo = await jupiterClient.fetchSwapInfo(
                    inputMintTokenAddress.toString(),
                    outputMintTokenAddress.toString(),
                    amountInLamports
                );
                
                console.log("   Preparing swap transaction...")
                const {swapTransaction, lastValidBlockHeight} = await jupiterClient.fetchSwapTransaction(new PublicKey(pubkey), swapInfo)

                console.log("   Executing swap via PDA...")
                const swapTxSignature = await this.pdaImpl.executeSwapPDA(
                    pubkey, 
                    swapTransaction
                );
                console.log("   ✅ Swap executed:", swapTxSignature)

                console.log("   Transferring SOL to trader...")
                const transferTxSig = await this.pdaImpl.transferSol(new PublicKey(pubkey), amount, traderPublicKey)
                console.log("   ✅ SOL transfer complete")
                console.log("   ✅ Transaction signature:", transferTxSig)

                return {
                    followerWallet: pubkey,
                    transferTxSig: transferTxSig
                };
            }))

            console.log("📊 All swaps processed successfully")
            console.log("   Total followers processed:", results.length)    
            const tradeResults = {
                traderWallet: traderPublicKey.toString(),
                followers: results
            };

            console.log("📊 Trade Results:", JSON.stringify(tradeResults, null, 2));
            console.log("\n✅ All swaps completed successfully")
            return JSON.stringify(tradeResults, null, 2);

        } catch (error) {
            console.error("\n❌ Error in PDA swap process:")
            console.error("   Trader:", traderPublicKey.toString())
            console.error("   Error details:", error instanceof Error ? error.message : String(error))
            throw new Error(`Failed to execute swap: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async calculateAmount(followPublicKey: PublicKey, traderPublicKey: PublicKey, inputTokenAmount:number): Promise<number> {
        try {
            console.log("🧮 Calculating swap amount...")
            console.log("   Follower:", followPublicKey.toString())
            console.log("   Trader:", traderPublicKey.toString())
            console.log("   Base amount:", inputTokenAmount)
            
            const trackedWallet = new WalletTrackerImpl()
            await trackedWallet.createWebhook([traderPublicKey.toString()])
            
            const distribution = await trackedWallet.getDistribution(traderPublicKey.toString())
            const percentage = this.selectMode(distribution, inputTokenAmount)
            console.log("   Selected percentage:", percentage * 100, "%")
            
            const pote = await this.pdaImpl.getPoteBalance(followPublicKey)
            console.log("   Follower's pote balance:", pote)
            
            const amount = pote * percentage
            console.log("   Final calculated amount:", amount)
            
            return amount
            
        } catch (error) {
            console.error("❌ Error calculating amount:")
            console.error("   Follower:", followPublicKey.toString())
            console.error("   Error details:", error instanceof Error ? error.message : String(error))
            throw error
        }
    }

    public selectMode(distribution:WalletDTO, tokenPercentage:number): number {
        var balance = distribution.usdBalance
        console.log("💰 Selecting mode based on balance:", balance, "USD")

        switch (true) {
            case balance >= 50_000:
                console.log("   Mode: High balance (≥ 50,000 USD)")
                return 0.1
            case balance < 50_000 && balance >= 10_000:
                console.log("   Mode: Medium balance (≥ 10,000 USD)")
                return 0.05
            default:
                console.log("   Mode: Standard")
                return tokenPercentage
        }
    }
}