import { Keypair, PublicKey} from "@solana/web3.js";
import { RewardTraderClient } from "../client/RewardTraderClient";
import * as anchor from "@coral-xyz/anchor";
import { P2a } from "../../../../target/types/p2a";

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
            
            await this.program.methods.initializeTrader()
            .accounts({
                signer: traderPublicKey,
                })
            .signers([trader])
            .rpc();

            console.log("Trader initialized successfully");
            
        } catch (error) {
            console.error("❌ Erro em initTrade:", error);
            throw error
            
        }
    
    }

    async authorizeTrader(){
        try {
            const trader = this.trader
            const traderPublicKey = this.trader.publicKey
            await this.program.methods
            .initializeTrader()
            .accounts({
                signer: traderPublicKey,
                })
            .signers([trader])
            .rpc();
            
            console.log("Trader authorized successfully");

        } catch (error) {
            console.error("❌ Erro em authorizeTrader:", error);
            throw error
        }
    }

    async addFollow(user:Keypair,traderPublicKey:PublicKey) {
        try {
            const trader = this.trader
            
            await this.program.methods
                .addFollower(traderPublicKey)
                .accounts({
                    signer: user.publicKey,
                })
                .signers([user])
                .rpc();
            
        } catch (error) {
            console.error("❌ Erro em addFollow:", error);
            throw error            
        }
    }
    
}