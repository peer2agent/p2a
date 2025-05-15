import { Keypair, PublicKey } from "@solana/web3.js";
import { PDAImpl } from "../../smart-contract-service/impl/PDAImpl";
import { TraderImpl } from "../../smart-contract-service/impl/TraderImpl";

export class InitializeTraderUseCase {

    async execute(traderKeypair:Keypair){
        try {
            console.log("🚀 Starting trader initialization process...")
            console.log("   Trader public key:", traderKeypair.publicKey.toString())
            
            const traderImpl = new TraderImpl(traderKeypair)
            
            console.log("📝 Creating trader account...")
            await traderImpl.initTrade()

            console.log("🔑 Setting up trader permissions...")
            await traderImpl.authorizeTrader()

            console.log("✅ Trader setup completed successfully")
            console.log("   Status: Ready for trading")
            console.log("   Permissions: Granted")
            console.log("   Follow List: Initialized")
            
        } catch (error) {
            console.error("❌ Error in trader initialization:")
            console.error("   Trader:", traderKeypair.publicKey.toString())
            console.error("   Error details:", error instanceof Error ? error.message : String(error))
            throw error
        }
    }

    async getFollowList(traderPublicKey:PublicKey){
        try {
            console.log("📋 Retrieving trader's follow list...")
            console.log("   Trader:", traderPublicKey.toString())
            
            const pdaImpl = new PDAImpl()
            const followList = await pdaImpl.getFollowersByTrader(traderPublicKey)

            console.log("✅ Follow list retrieved successfully")
            console.log("   Total followers:", followList.length)
            console.log("   Active followers:", followList)
            
            return followList
        } catch (error) {
            console.error("❌ Error retrieving follow list:")
            console.error("   Trader:", traderPublicKey.toString())
            console.error("   Error details:", error instanceof Error ? error.message : String(error))
            throw error
        }
    }

    async addFollow(userKeypair:Keypair, traderPubkey:PublicKey) {
        try {
            console.log("👥 Processing new follow request...")
            console.log("   User:", userKeypair.publicKey.toString())
            console.log("   Trader to follow:", traderPubkey.toString())
            
            const traderImpl = new TraderImpl(userKeypair)
            await traderImpl.addFollow(userKeypair, traderPubkey)
            
            console.log("✅ Follow relationship established")
            console.log("   Status: Active")
            console.log("   User can now copy trader's transactions")
            
        } catch (error) {
            console.error("❌ Error establishing follow relationship:")
            console.error("   User:", userKeypair.publicKey.toString())
            console.error("   Trader:", traderPubkey.toString())
            console.error("   Error details:", error instanceof Error ? error.message : String(error))
            throw error
        }
    }
}