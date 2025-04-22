import { AccountInfo, Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { RewardTraderClient } from "../client/RewardTraderClient";

export class RewardTraderImpl {
    private payer: Keypair
    private seed: string
    private connection: Connection
    private rewardTraderClient: RewardTraderClient
    
    constructor(user:string,payer:Keypair) {
        this.payer = payer
        this.seed = user
        this.rewardTraderClient = new RewardTraderClient()
        this.connection = this.rewardTraderClient.connection
        
    }

    async sendTokenToTrader(amountInLamports:number, recipient: String) {

        var programId = await this.getProgramId() 
    
        const greetedPubkey = await PublicKey.createWithSeed(
            this.payer!.publicKey,
            this.seed,
            programId,
        );

        const accountInfo = await this.connection.getAccountInfo(greetedPubkey);
        
        await this.validateAccountInfo(accountInfo,greetedPubkey,programId)

        var recipientPubkey = new PublicKey(recipient); 

        const data = Buffer.alloc(1 + 4 + 32);
        
        data[0] = 0; 

        data.writeUInt32LE(amountInLamports, 1); // valor
        
        recipientPubkey.toBuffer().copy(data, 5);

        const instruction = new TransactionInstruction({
            programId,
            keys: [
                { pubkey: this.payer!!.publicKey, isSigner: true, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: recipientPubkey, isSigner: false, isWritable: true }

            ],
            data,
        });

        console.log("Enviando transação...");
        await sendAndConfirmTransaction(this.connection, new Transaction().add(instruction), [this.payer!]);
        console.log("✅ Transação enviada!");


    }

    async validateAccountInfo(accountInfo: AccountInfo<Buffer> | null, greetedPubkey: PublicKey, programId: PublicKey) {

        if (!accountInfo) {
            const lamports = await this.connection.getMinimumBalanceForRentExemption(0);

            const createAccountIx = SystemProgram.createAccountWithSeed({
                fromPubkey: this.payer!.publicKey,
                basePubkey: this.payer!.publicKey,
                seed: this.seed,
                newAccountPubkey: greetedPubkey,
                lamports,
                space: 0,
                programId,
            });

            const tx = new Transaction().add(createAccountIx);
            await sendAndConfirmTransaction(this.connection, tx, [this.payer!]);
            console.log("Conta criada:", greetedPubkey.toBase58());
        } else {
            console.log("Conta já criada");
            
        }
    }

    async getProgramId():Promise<PublicKey> {
        const programKeypair = await this.rewardTraderClient.getKeyPair();
        return programKeypair.publicKey;
    }
}