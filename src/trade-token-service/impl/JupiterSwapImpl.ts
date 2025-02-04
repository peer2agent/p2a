import { Keypair, PublicKey} from '@solana/web3.js';
import { InputSwapDTO } from '../dto/InputSwapDTO';
import { JupiterClientSwap } from '../client/JupiterClientSwap';

export class JupiterImpl {
    private jupyterClient:JupiterClientSwap
    private swapUserKeypair:Keypair
    private outputMintTokenAddress: string;
    private inputMintTokenAddress: string 

    constructor(inputSwap:InputSwapDTO) {
        
        const { outputMintTokenAddress, inputMintTokenAddress, connection, ownerUserKey, isSimulation } = inputSwap;
        this.jupyterClient = new JupiterClientSwap(connection,isSimulation)
        this.inputMintTokenAddress = inputMintTokenAddress.toString()
        this.outputMintTokenAddress = outputMintTokenAddress.toString()
        this.swapUserKeypair = ownerUserKey
    }
    
    async realiseSwap(amount:number) {
        try {
            
            const swapInfo = await this.jupyterClient.fetchSwapInfo(this.inputMintTokenAddress,this.outputMintTokenAddress, amount)

            const {swapTransaction, lastValidBlockHeight} = await this.jupyterClient.fetchSwapTransaction(this.swapUserKeypair, swapInfo)
            
            await this.jupyterClient.sendTransaction(swapTransaction,this.swapUserKeypair, lastValidBlockHeight)
        
        } catch (error) {
            console.error('Error', error)
        }

    }
}