import { TransactionType } from "helius-sdk";
import { SwapTransactionDTO, TransferTransactionDTO } from "../../transaction-processor-service/dto/TransactionDTO";
import { TransactionProcessorImpl } from "../../transaction-processor-service/impl/TransactionProcessorImpl";
import { JupiterImpl } from "../../trade-token-service/impl/JupiterSwapImpl";
import { InputSwapDTO } from "../../trade-token-service/dto/InputSwapDTO";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";

export class TransactionProcessorUseCase {
    private processor: TransactionProcessorImpl;
    private pullWallet: Keypair;
    private connection = new Connection("https://api.mainnet-beta.solana.com");

    constructor(trackedWallet: string) {
        this.processor = new TransactionProcessorImpl(trackedWallet);
        
        const keypairBase58 = process.env.SECRET_KEY!!;

        const keypairBytes = bs58.decode(keypairBase58);

        this.pullWallet = Keypair.fromSecretKey(keypairBytes);
    }

    async processWebhook(webhookData: any): Promise<void> {
        try {
            
            const transaction = this.processor.processTransaction(webhookData);
            
            if (!transaction) {
                console.log("Unknown transaction type");
                return;
            }
    
            if (transaction.type === TransactionType.SWAP) {
                await this.handleSwap(transaction);
                
            } else {
                await this.handleTransfer(transaction);
    
            }
        
        } catch (error) {
            console.log("Error processing webhook", error)
            
        }}

    private async handleSwap(swap: SwapTransactionDTO): Promise<void> {
        try {
            
            console.log(`Processing ${swap.platform} swap for wallet: ${swap.trackedWallet}`)
            console.log(`Processing ${swap.platform} swap:`);
            console.log(`Input: ${swap.inputToken.amount} ${swap.inputToken.mint}`);
            console.log(`Output: ${swap.outputToken.amount} ${swap.outputToken.mint}`);
            
            var solToken = new PublicKey("So11111111111111111111111111111111111111112") 
            
            const inputSwapDTO: InputSwapDTO = {
                outputMintTokenAddress: new PublicKey(swap.outputToken.mint),
                inputMintTokenAddress: new PublicKey(swap.inputToken.mint),  
                connection: this.connection, 
                ownerUserKey:this.pullWallet, 
                isSimulation: false,
            }

            if ((inputSwapDTO.outputMintTokenAddress || inputSwapDTO.inputMintTokenAddress) !== solToken) {
                console.log("Swap is not for SOL token, skipping")
                return
            }
    
            const jupiter = new JupiterImpl(inputSwapDTO)
    
            const trackedWallet = new WalletTrackerImpl()
    
            await trackedWallet.createWebhook(
                [swap.trackedWallet]
            )
    
            const distribution = await trackedWallet.getDistribution(swap.trackedWallet)
    
            const percentage = jupiter.selectMode(distribution, swap.inputToken.amount)
    
            const myBalance = await jupiter.getBalance()
    
            var amount =  myBalance * percentage
    
            await jupiter.realiseSwap(Math.floor(amount))
    
            console.log("Copy trade realized successfully")
        } catch (error) {
            console.log("Error processing swap", error)
        }

    }

    private async handleTransfer(transfer: TransferTransactionDTO): Promise<void> {
        console.log(`Processing transfer:`);
        console.log(`Processing swap for wallet: ${transfer.trackedWallet}`)
        console.log(`From: ${transfer.fromAddress}`);
        console.log(`To: ${transfer.toAddress}`);
        console.log(`Amount: ${transfer.token.amount} ${transfer.token.mint}`);
    }

    //TODO: ADD LOGICA DE TRANSFER
}