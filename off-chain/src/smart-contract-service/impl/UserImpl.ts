import { Keypair } from "@solana/web3.js";
import { RewardTraderClient } from "../client/RewardTraderClient";
import * as anchor from "@coral-xyz/anchor";
import { P2a } from "../../../../target/types/p2a";


export class UserImpl {
    private payer: Keypair
    private program: anchor.Program<P2a>


    private rewardTraderClient: RewardTraderClient
    
    constructor(payer:Keypair) {
        this.payer = payer
        this.rewardTraderClient = new RewardTraderClient()
        this.program= this.rewardTraderClient.program
        
    }

    async makeApport(value:number):Promise<string>{
        try{
            const payer = this.payer
            const payerPublicKey = this.payer.publicKey
            const [potePda] = this.getPDA("pote", payerPublicKey);
            console.log("kiska")
            
            await this.program.methods
            .makeApport(value)
            .accounts({
                signer: payerPublicKey,
            })
            .signers([payer])
            .rpc()
            console.log("passou")
            return potePda.toBase58()

        }catch (e) {
            console.error("❌ Erro em makeApport:", e);
            throw e;
        }
          
    }

    async addBalance(value:number){
        try {
            const payer = this.payer
            const payerPublicKey = this.payer.publicKey
            
            await this.program.methods
            .updateApport(value)
            .accounts({
              signer: payerPublicKey,
            })
            .signers([payer])
            .rpc();
            
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    async authorizateTransactionByPDA(){
        try {
            const payer = this.payer
            const payerPublicKey = this.payer.publicKey
            const [swapPda] = this.getPDA("swap_authority", payerPublicKey);
            
            await this.program.methods
            .delegateSwapAuthority()
            .accounts({
              user: payerPublicKey,
            })
            .signers([payer])
            .rpc();

            const acc = await this.program.account.swapDelegate.fetch(swapPda)
            console.log("swapPda -> ", swapPda.toBase58())  
            return acc
        } catch (error){
            console.error(error)
            throw error
        }
            
    }

    async tranferSolToTrader( amount:number, traderPublicKey:string){
        try {
            const payer = this.payer
            const payerPublicKey = this.payer.publicKey
            const [swapPda] = this.getPDA("swap_authority", payerPublicKey);
            
            await this.program.methods
            .delegateSwapAuthority()
            .accounts({
              user: payerPublicKey,
            })
            .signers([payer])
            .rpc();

            const acc = await this.program.account.swapDelegate.fetch(swapPda)
            console.log("swapPda -> ", swapPda.toBase58())  
            return acc
        } catch (error){
            console.error(error)
            throw error
        }
            
    }


    private getPDA(seed: string, pubkey: anchor.web3.PublicKey){
        return this.rewardTraderClient.getPDA(seed, pubkey)
    }


}
