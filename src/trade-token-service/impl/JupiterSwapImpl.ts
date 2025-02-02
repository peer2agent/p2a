import { Keypair, PublicKey} from '@solana/web3.js';
import { InputSwapDTO } from '../dto/InputSwapDTO';
import { JupiterClientSwap } from '../client/JupiterClientSwap';

export class JupiterImpl {
    private jupyterClient:JupiterClientSwap
    private swapUserKeypair:Keypair
    private outputMintTokenAddress: PublicKey;
    private inputMintTokenAddress: PublicKey 

    constructor(inputSwap:InputSwapDTO, swapUserKeypair:Keypair ) {
        
        const { outputMintTokenAddress, inputMintTokenAddress, connection } = inputSwap;
        this.jupyterClient = new JupiterClientSwap(connection)
        this.inputMintTokenAddress = inputMintTokenAddress
        this.outputMintTokenAddress = outputMintTokenAddress
        this.swapUserKeypair = swapUserKeypair
    }
    
    async realiseSwap(amount:number) {
        try {
            
            const swapInfo = await this.jupyterClient.fetchSwapInfo(this.inputMintTokenAddress.toString(),this.outputMintTokenAddress.toString(),amount)

            const {swapTransaction, lastValidBlockHeight} = await this.jupyterClient.fetchSwapTransaction(this.swapUserKeypair, swapInfo)
            
            await this.jupyterClient.sendTransaction(swapTransaction,this.swapUserKeypair, lastValidBlockHeight)
        
        } catch (error) {
            console.error('Error', error)
        }

    }
}