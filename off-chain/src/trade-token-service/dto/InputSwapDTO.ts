import { Connection, Keypair, PublicKey } from "@solana/web3.js"

export interface InputSwapDTO {
    outputMintTokenAddress: PublicKey
    inputMintTokenAddress: PublicKey
    ownerUserKey:Keypair,
    isSimulation:boolean

}