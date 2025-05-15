import { Keypair } from "@solana/web3.js";
import { TraderImpl } from "../../smart-contract-service/impl/TraderImpl";

export class UserBalanceUseCase {
    private user: Keypair;

    constructor(user: Keypair) {
        this.user = user;
    }

    async execute(amount: number) {
        try {
            console.log("💰 Processing initial balance setup...")
            console.log("   User:", this.user.publicKey.toString())
            console.log("   Amount:", amount)

            const traderImpl = new TraderImpl(this.user);
            await traderImpl.initTrade();

            console.log("✅ Initial balance setup completed")
            console.log("   Status: Success")
            console.log("   Account: Ready for trading")
            
        } catch (error) {
            console.error("❌ Error in initial balance setup:")
            console.error("   User:", this.user.publicKey.toString())
            console.error("   Amount:", amount)
            console.error("   Error details:", error instanceof Error ? error.message : String(error))
            throw error;
        }
    }

    async addBalance(amount: number) {
        try {
            console.log("💸 Processing balance addition...")
            console.log("   User:", this.user.publicKey.toString())
            console.log("   Amount to add:", amount)

            const traderImpl = new TraderImpl(this.user);
            await traderImpl.initTrade();

            console.log("✅ Balance addition completed")
            console.log("   Status: Success")
            console.log("   New funds: Available for trading")
            
        } catch (error) {
            console.error("❌ Error adding balance:")
            console.error("   User:", this.user.publicKey.toString())
            console.error("   Amount:", amount)
            console.error("   Error details:", error instanceof Error ? error.message : String(error))
            throw error;
        }
    }
}