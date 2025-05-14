import { Keypair, PublicKey} from '@solana/web3.js';
import { InputSwapDTO } from '../dto/InputSwapDTO';
import { JupiterClientSwap } from '../client/JupiterClientSwap';
import { WalletDTO } from '../../wallet-tracker-service/dto/WalletDTO';


export class JupiterImpl {
    private jupyterClient:JupiterClientSwap
    private swapUserKeypair:Keypair
    private outputMintTokenAddress: PublicKey;
    private inputMintTokenAddress: PublicKey 
    

    constructor(inputSwap:InputSwapDTO) {
        
        const { outputMintTokenAddress, inputMintTokenAddress, ownerUserKey, isSimulation } = inputSwap;
        this.jupyterClient = new JupiterClientSwap(isSimulation)
        this.inputMintTokenAddress = inputMintTokenAddress
        this.outputMintTokenAddress = outputMintTokenAddress
        this.swapUserKeypair = ownerUserKey
    }
    
    async realiseSwap(amount:number) {
        try {
            
            const swapInfo = await this.jupyterClient.fetchSwapInfo(this.inputMintTokenAddress.toString(),this.outputMintTokenAddress.toString(), amount)
            console.log("passou o swapInfo")
            const {swapTransaction, lastValidBlockHeight} = await this.jupyterClient.fetchSwapTransaction(this.swapUserKeypair.publicKey, swapInfo)
            console.log("Fez o fatch das transações")
            await this.jupyterClient.sendTransaction(swapTransaction,this.swapUserKeypair, lastValidBlockHeight)
            console.log("Finalizou a transação")
        
        } catch (error) {
            console.error('Error', error)
        }
    }


}