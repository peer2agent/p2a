import { Connection, PublicKey } from "@solana/web3.js"

export interface InputSwapDTO {
    outputMintTokenAddress: PublicKey
    inputMintTokenAddress: PublicKey
    connection: Connection

}