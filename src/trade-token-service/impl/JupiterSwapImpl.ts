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
        
        const { outputMintTokenAddress, inputMintTokenAddress, connection, ownerUserKey, isSimulation } = inputSwap;
        this.jupyterClient = new JupiterClientSwap(connection,isSimulation)
        this.inputMintTokenAddress = inputMintTokenAddress
        this.outputMintTokenAddress = outputMintTokenAddress
        this.swapUserKeypair = ownerUserKey
    }
    
    async realiseSwap(amount:number) {
        try {
            
            const swapInfo = await this.jupyterClient.fetchSwapInfo(this.inputMintTokenAddress.toString(),this.outputMintTokenAddress.toString(), amount)

            const {swapTransaction, lastValidBlockHeight} = await this.jupyterClient.fetchSwapTransaction(this.swapUserKeypair, swapInfo)
            
            await this.jupyterClient.sendTransaction(swapTransaction,this.swapUserKeypair, lastValidBlockHeight)
        
        } catch (error) {
            console.error('Error', error)
        }
    }

    public selectMode(wallet:WalletDTO, tokenPercentage:number): number {
        var balance = wallet.usdBalance

        switch (true) {
            case balance >= 50_000:
                console.log("balance >= 50_000")
                return 0.1
            case balance < 50_000 && balance >=10_000:
                console.log("balance >= 10_000")
                return 0.05
            default:
                console.log("balance menor")
                return tokenPercentage
        }
    }

    public async getBalance(): Promise<number> {
        return this.jupyterClient.getBalance(this.inputMintTokenAddress)
    }
}