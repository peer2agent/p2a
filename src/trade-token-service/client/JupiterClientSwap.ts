import { PublicKey, Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SwapInfoDTO } from '../dto/SwapInfoDTO';   
import { InputSwapDTO } from '../dto/InputSwapDTO';


export class JupiterClientSwap {
    private outputMintTokenAddress: PublicKey; //usdc
    private inputMintTokenAddress: PublicKey //sol 
    private ownerPublicKey: PublicKey
    private connection: Connection
    private feeAccount: PublicKey
    private trackingAccount : PublicKey 

    constructor(inputSwap:InputSwapDTO) {
        const {
        outputMintTokenAddress,
        inputMintTokenAddress,
        ownerPublicKey,
        connection,
        feeAccount,
        trackingAccount} = inputSwap;

        this.outputMintTokenAddress = outputMintTokenAddress 
        this.inputMintTokenAddress = inputMintTokenAddress 
        this.ownerPublicKey = ownerPublicKey 
        this.connection = connection 
        this.feeAccount = feeAccount 
        this.trackingAccount = trackingAccount  

    }


    async getOwnerMintTokenAccount() {
        const ownerMintTokenAccount = await getAssociatedTokenAddress(
            this.outputMintTokenAddress,
            this.ownerPublicKey,
            true,
            TOKEN_PROGRAM_ID,// ver se tem dev
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        return ownerMintTokenAccount
    }

    async fetchSwapInfo(amount :number) {
        var url = `https://quote-api.jup.ag/v6/quote?inputMint=${this.inputMintTokenAddress}&outputMint=${this.outputMintTokenAddress}&amount=${amount}&swapMode=ExactOut&slippageBps=1`
        console.log(url)
        const response = await fetch(url)
        const data = await response.json()

        console.log("data -> ",data)

        return {
            inAmount: data.inAmount,
            otherAmountThreshold: data.otherAmountThreshold,
            quoteResponse: data
        };
    }

    async fetchSwapTransaction(swapUserKeypair:Keypair, ownerMintTokenAccount:PublicKey, swapInfo:SwapInfoDTO) {
        
        const requestBody = {
            userPublicKey: swapUserKeypair.publicKey.toBase58(),
            wrapAndUnwrapSol: true,
            useSharedAccounts: true,
            feeAccount: this.feeAccount.toBase58(), // Use actual key
            trackingAccount: this.trackingAccount.toBase58(), // Use actual key
            prioritizationFeeLamports: 0, // No prioritization fee in this case
            asLegacyTransaction: false,
            useTokenLedger: false,
            destinationTokenAccount: ownerMintTokenAccount.toBase58(),
            dynamicComputeUnitLimit: true,
            skipUserAccountsRpcCalls: true,
            quoteResponse: swapInfo.quoteResponse

        }

        const response = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const { swapTransaction, lastValidBlockHeight } = await response.json();
        return { swapTransaction, lastValidBlockHeight };

    }


    async sendTransaction(swapTransaction: any, swapUserKeypair:any, lastValidBlockHeight:any) {
        const transaction = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'))
        const bhInfo = await this.connection.getLatestBlockhashAndContext({ commitment: "finalized" });
        
        // transaction.recentBlockhash  = bhInfo.value.blockhash;
        // transaction.feePayer = swapUserKeypair.publicKey;

        transaction.sign([swapUserKeypair]);

        const simulation = await this.connection.simulateTransaction(transaction, { commitment: "finalized" });
        if (simulation.value.err) {
            throw new Error(`Simulation failed: ${simulation.value.err.toString()}`);
        }

        try {
            const signature = await this.connection.sendTransaction(transaction, {
            // NOTE: Adjusting maxRetries to a lower value for trading, as 20 retries can be too much
            // Experiment with different maxRetries values based on your tolerance for slippage and speed
            // Reference: https://solana.com/docs/core/transactions#retrying-transactions
            maxRetries: 5,
            skipPreflight: true,
            preflightCommitment: "finalized",
        });
        const confirmation = await this.connection.confirmTransaction({
            signature,
            blockhash: bhInfo.value.blockhash,
            lastValidBlockHeight: bhInfo.value.lastValidBlockHeight,
        }, "finalized");
        
        if (confirmation.value.err) {
            throw new Error(`Transaction not confirmed: ${confirmation.value.err.toString()}`);
        }
        
        console.log("Confirmed: ", signature);
        } catch (error) {
            console.error("Failed: ", error);
        throw error;
        } 

    }

}