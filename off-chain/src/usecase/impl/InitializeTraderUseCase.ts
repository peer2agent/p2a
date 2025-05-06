import { Keypair, PublicKey } from "@solana/web3.js";
import { PDAImpl } from "../../smart-contract-service/impl/PDAImpl";
import { TraderImpl } from "../../smart-contract-service/impl/TraderImpl";

export class InitializeTraderUseCase{

    async execute(traderKeypair:Keypair){

        try {
            const traderImpl = new TraderImpl(traderKeypair)
            
            traderImpl.initTrade()

            traderImpl.authorizeTrader()

            console.log("Trader initialized and authorized successfully")
        } catch (error) {
            console.error("execute error -> ",error)
        }

    }

    async getFollowList(traderPublicKey:PublicKey){
        try {
            const pdaImpl = new PDAImpl()
            
            const followList = await pdaImpl.getFollowersByTrader(traderPublicKey)

            console.log("Follow list retrieved successfully", followList)
        } catch (error) {
            console.error("getFollowList -> ",error)
        }
    }

    async addFollow(userKeypair:Keypair,traderPubkey:PublicKey) {
        try {
            const traderImpl = new TraderImpl(userKeypair)
    
            traderImpl.addFollow(userKeypair,traderPubkey)
            
        } catch (error) {
            console.log("error -> ", error)
        }

    }
}