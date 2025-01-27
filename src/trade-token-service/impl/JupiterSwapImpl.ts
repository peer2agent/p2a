import { Keypair, PublicKey} from '@solana/web3.js';
import { InputSwapDTO } from '../dto/InputSwapDTO';
import { JupiterClientSwap } from '../client/JupiterClientSwap';

export class JupiterImpl {
    private jupyterClient:JupiterClientSwap
    private swapUserKeypair:Keypair

    constructor(inputSwap:InputSwapDTO, swapUserKeypair:Keypair ) {  
        this.jupyterClient = new JupiterClientSwap(inputSwap)
        this.swapUserKeypair = swapUserKeypair
    }
    
    async realiseSwap(amount:number) {
        try {
        
            const ownerMintTokenAccount = await this.jupyterClient.getOwnerMintTokenAccount()

            console.log("ownerMintTokenAccount -> ",ownerMintTokenAccount)
            
            const swapInfo = await this.jupyterClient.fetchSwapInfo(amount)

            console.log("swapInfo -> ",swapInfo)
            
            const {swapTransaction, lastValidBlockHeight} = await this.jupyterClient.fetchSwapTransaction(this.swapUserKeypair, ownerMintTokenAccount, swapInfo)
            
            console.log("swapTransaction -> ",swapTransaction)

            console.log("lastValidBlockHeight -> ",lastValidBlockHeight)
            
            await this.jupyterClient.sendTransaction(swapTransaction,this.swapUserKeypair, lastValidBlockHeight)
        
        } catch (error) {
            console.error('Error', error)
        }

    }
}