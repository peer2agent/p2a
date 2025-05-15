import { Keypair, PublicKey} from "@solana/web3.js";
import { RewardTraderClient } from "../client/RewardTraderClient";
import * as anchor from "@coral-xyz/anchor";
import { P2a } from "../../../../target/types/p2a";
import { use } from "chai";

export class TraderImpl {
    private trader: Keypair
    private program: anchor.Program<P2a>
    private rewardTraderClient: RewardTraderClient
    
    constructor(trader:Keypair) {
        this.trader = trader
        this.rewardTraderClient = new RewardTraderClient()
        this.program= this.rewardTraderClient.program
        
    }

    async initTrade() {
        try {
            const trader = this.trader
            const traderPublicKey = this.trader.publicKey
            
            console.log("🚀 Initializing trader account...")
            console.log("   Trader public key:", traderPublicKey.toString())
            
            await this.program.methods.initializeTrader()
            .accounts({
                signer: traderPublicKey,
                })
            .signers([trader])
            .rpc();

            console.log("✅ Trader initialized successfully")
            console.log("   Ready to accept followers and execute trades")
            
        } catch (error) {
            console.error("❌ Error initializing trader:", error);
            throw error
        }
    }

    async authorizeTrader(){
        try {
            const trader = this.trader
            const traderPublicKey = this.trader.publicKey
            
            console.log("🔑 Authorizing trader permissions...")
            console.log("   Trader public key:", traderPublicKey.toString())
            
            await this.program.methods
            .initializeTrader()
            .accounts({
                signer: traderPublicKey,
                })
            .signers([trader])
            .rpc();
            
            console.log("✅ Trader authorized successfully")
            console.log("   Full trading permissions granted")

        } catch (error) {
            console.error("❌ Error authorizing trader:", error);
            console.error("   Details:", error instanceof Error ? error.message : String(error))
            throw error
        }
    }

    async addFollow(user:Keypair,traderPublicKey:PublicKey) {
        const [followListPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("follow_list"), traderPublicKey.toBuffer()],
            this.program.programId
        );

        try {
            console.log("👥 Processing follow request...")
            console.log("   User:", user.publicKey.toString())
            console.log("   Trader:", traderPublicKey.toString())
            console.log("   Follow List PDA:", followListPDA.toString())

            await this.program.methods
                .addFollower()
                .accounts({
                    follower: user.publicKey,
                    trader: traderPublicKey,
                })
                .signers([user])
                .rpc();
            
            console.log("✅ Follow request processed successfully")
            console.log("   User is now following trader")
            console.log("   Follow list updated at:", followListPDA.toString())
            
        } catch (error) {
            console.error("❌ Error processing follow request:")
            console.error("   User:", user.publicKey.toString())
            console.error("   Trader:", traderPublicKey.toString())
            console.error("   Error details:", error instanceof Error ? error.message : String(error))
            throw error            
        }
    }


    
}