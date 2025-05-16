import { Keypair } from "@solana/web3.js";
import { UserImpl } from "../../smart-contract-service/impl/UserImpl";

export class UserBalanceUseCase {
    private userImpl: UserImpl;
    private user: Keypair;

    constructor(user: Keypair) {
        const userImpl = new UserImpl(user)
        this.userImpl = userImpl
        this.user = user;
    }

    async execute(amount: number) {
        try {
            console.log("💰 Processing initial balance setup...")
            console.log("   User:", this.user.publicKey.toString())
            console.log("   Amount:", amount)

            this.userImpl.makeApport(amount)
            this.userImpl.authorizateTransactionByPDA()

            console.log("✅ Initial balance setup completed")
            console.log("   Status: Success")
            
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

            await this.userImpl.addBalance(amount)

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
