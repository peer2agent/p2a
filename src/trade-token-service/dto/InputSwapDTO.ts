import { Connection, PublicKey } from "@solana/web3.js"

export interface InputSwapDTO {
    outputMintTokenAddress: PublicKey
    inputMintTokenAddress: PublicKey
    ownerPublicKey: PublicKey
    connection: Connection
    feeAccount: PublicKey
    trackingAccount : PublicKey

}