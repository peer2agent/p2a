import {Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import { SwapInfoDTO } from '../dto/SwapInfoDTO';  
import { Wallet } from '@project-serum/anchor';
import { randomUUID } from 'crypto';


export class JupiterClientSwap {
    private connection: Connection
    private isSimulationTransaction: boolean;

    constructor(connection: Connection, isSimulation:boolean) {
        this.connection = connection;
        this.isSimulationTransaction = isSimulation;
    }


    async fetchSwapInfo(inputMintTokenAddress:string,outputMintTokenAddress:string,amount :number) {

        console.log("fetchSwapInfo2")
        
        var url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMintTokenAddress}&outputMint=${outputMintTokenAddress}&amount=${amount}&swapMode=ExactOut&slippageBps=1`
        console.log(url)
        const response = await fetch(url)
        const data = await response.json()

        if (response.status !== 200) {
            
            throw new Error(`Failed to fetch swap info: ${data.error} for ${inputMintTokenAddress} to ${outputMintTokenAddress}`);
        }

        return {
            inAmount: data.inAmount,
            otherAmountThreshold: data.otherAmountThreshold,
            quoteResponse: data
        };
    }

    async fetchSwapTransaction(swapUserKeypair:Keypair, swapInfo:SwapInfoDTO) {

        try{
            const quoteResponse=swapInfo.quoteResponse
    
            const swapResponse = await (
                await fetch('https://quote-api.jup.ag/v6/swap', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    // quoteResponse from /quote api
                    quoteResponse,
                    // user public key to be used for the swap
                    userPublicKey: swapUserKeypair.publicKey.toString(),
                    // auto wrap and unwrap SOL. default is true
                    wrapAndUnwrapSol: true,
                    // Optional, use if you want to charge a fee.  feeBps must have been passed in /quote API.
                    feeAccount: swapUserKeypair.publicKey.toString(),
    
                    prioritizationFeeLamports: 20000
                  })
                })
              ).json();
    
            
            const { swapTransaction, lastValidBlockHeight } = swapResponse;
    
            return { swapTransaction, lastValidBlockHeight };

        }catch(error){
            console.error(`m=fetchSwapTransaction error=${error}`)
            throw error
        }
        

    }

    async sendTransaction(swapTransaction: any, swapUserKeypair: Keypair, lastValidBlockHeight: number): Promise<any> {

        if (!swapTransaction) {
            throw new Error(`Received an undefined swapTransaction from Jupiter API -> ${swapTransaction}`);
        }

        if (this.isSimulationTransaction) {
            console.log("Simulation mode enabled, skipping transaction...")
            return randomUUID();
        }
        
        try {
            const wallet = new Wallet(swapUserKeypair);
    
            // Deserialize the transaction
            const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    
            // Check if the transaction is still valid
            const currentSlot = await this.connection.getSlot();
            if (currentSlot > lastValidBlockHeight) {
                console.warn("Transaction expired before being sent, retrying with new blockhash...");
                const { blockhash, lastValidBlockHeight: newLastValidBlockHeight } = await this.connection.getLatestBlockhash();
                transaction.message.recentBlockhash = blockhash;
                lastValidBlockHeight = newLastValidBlockHeight;
            }
    
            transaction.sign([wallet.payer]);
    
            const rawTransaction = transaction.serialize();
            const txid = await this.connection.sendRawTransaction(rawTransaction, {
                skipPreflight: false,
                maxRetries: 2,
            });
    
            console.log("Transaction sent, checking status...");
    
            let status = await this.connection.getSignatureStatus(txid, { searchTransactionHistory: true });
            let retries = 15;
    
            while (!status?.value?.confirmationStatus && retries > 0) {
                console.log(`Waiting for confirmation... ${retries} attempts left.`);
                await new Promise(res => setTimeout(res, 2000)); // Wait 2 seconds
                status = await this.connection.getSignatureStatus(txid, { searchTransactionHistory: true });
                retries--;
            }
    
            if (!status?.value?.confirmationStatus) {
                console.warn("Transaction might have been processed but confirmation failed.");
            }
    
            console.log(`Transaction successful: https://solscan.io/tx/${txid}`);
            return txid;
    
        } catch (error) {
            console.error("Failed to send transaction:", error);
            throw error;
        }
    }


    }
