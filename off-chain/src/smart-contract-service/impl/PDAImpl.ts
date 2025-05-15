import { ComputeBudgetProgram, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, VersionedTransaction } from "@solana/web3.js";
import { P2a } from "../../../../target/types/p2a"; 
import { RewardTraderClient } from "../client/RewardTraderClient";
import * as anchor from "@coral-xyz/anchor";
import * as fs from "fs";
import { error } from "console";

export class PDAImpl {
    private program: anchor.Program<P2a>
    private rewardTraderClient: RewardTraderClient
    public connection: Connection
    public provider: anchor.AnchorProvider
    
    constructor() {
        this.rewardTraderClient = new RewardTraderClient()
        this.program = this.rewardTraderClient.program
        this.connection = this.rewardTraderClient.connection
        this.provider = this.rewardTraderClient.provider
    }


    async executeSwapPDA(
        user: PublicKey | string,
        swapTxBase64: string
      ): Promise<string> {
        try {
          const userPubkey = typeof user === "string" ? new PublicKey(user) : user;
      
          // Generate the PDA for the swap delegate authority
          const [swapDelegate] = PublicKey.findProgramAddressSync(
            [Buffer.from("swap_authority"), userPubkey.toBuffer()],
            this.program.programId
          );
      
          // Decode the base64 transaction
          const txBuf = Buffer.from(swapTxBase64, "base64");
          if (!txBuf || txBuf.length === 0) {
            throw new Error("Empty or invalid transaction buffer");
          }
          
          // Try to deserialize transaction
          const versionedTx = VersionedTransaction.deserialize(txBuf);
          const message = versionedTx.message;
          
          // Log transaction details for debugging
          console.log("Transaction message version:", message.version);
          console.log("Static accounts count:", message.staticAccountKeys.length);
          console.log("Instructions count:", message.compiledInstructions.length);
          
          // Check if we're dealing with a transaction that uses ALTs
          if (message.addressTableLookups && message.addressTableLookups.length > 0) {
            console.log("Address lookup tables detected:", message.addressTableLookups.length);
            
            // Extract the Jupiter instruction (usually the first one)
            const jupIx = message.compiledInstructions[0];
            const jupiterProgramId = message.staticAccountKeys[jupIx.programIdIndex];
            
            console.log("Jupiter Program ID:", jupiterProgramId.toBase58());
            
            // Extract instruction data
            const ixDataBytes = Buffer.from(jupIx.data);
            console.log("Instruction data length:", ixDataBytes.length, "bytes");
            
            // Since we can't resolve the ALTs, let's create a simplified version of the transaction
            console.log("Unable to resolve ALTs. Using simplified transaction approach.");
            
            // Create our program instruction with minimal accounts
            const executeSwapIx = await this.program.methods
              .executeSwap(ixDataBytes)
              .accounts({
                user: userPubkey,
                // swapAuthority: swapDelegate,
                jupiterProgram: jupiterProgramId,
              })
              .instruction();
            
            // Set a high compute budget
            const computeIx = ComputeBudgetProgram.setComputeUnitLimit({
              units: 1_000_000, // Maximum compute units
            });
            
            // Build and send transaction
            const tx = new Transaction().add(computeIx).add(executeSwapIx);
            const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
            tx.recentBlockhash = blockhash;
            tx.feePayer = this.provider.wallet.publicKey;
            
            // Sign and send
            const txSig = await sendAndConfirmTransaction(
              this.connection,
              tx,
              [this.provider.wallet.payer!],
              { skipPreflight: true }
            );
            
            console.log("✅ Transaction confirmed:", txSig);
            return txSig;
          } else {
            // For non-ALT transactions, use the standard approach
            console.log("No address lookup tables found, using standard approach");
            
            // Extract the Jupiter instruction
            const jupIx = message.compiledInstructions[0];
            const accountKeys = message.staticAccountKeys;
            const jupiterProgramId = accountKeys[jupIx.programIdIndex];
              
            // Extract instruction data
            const ixDataBytes = Buffer.from(jupIx.data);
            console.log("Instruction data length:", ixDataBytes.length, "bytes");
            
            // Create our program instruction
            const executeSwapIx = await this.program.methods
              .executeSwap(ixDataBytes)
              .accounts({
                user: userPubkey,
                // swapAuthority: swapDelegate,
                jupiterProgram: jupiterProgramId,
              })
              .instruction();
              
            const computeIx = ComputeBudgetProgram.setComputeUnitLimit({
              units: 800_000,
            });
              
            const tx = new Transaction().add(computeIx).add(executeSwapIx);
            const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
            tx.recentBlockhash = blockhash;
            tx.feePayer = this.provider.wallet.publicKey;
              
            const txSig = await sendAndConfirmTransaction(
              this.connection,
              tx,
              [this.provider.wallet.payer!],
              { skipPreflight: true }
            );
              
            console.log("✅ Transaction confirmed:", txSig);
            return txSig;
          }
        } catch (error) {
          console.error("❌ Error in executeSwapPDA:", error);
          throw error;
        }
      }
      
    async transferSol(userPubkey: PublicKey, amount: number, traderPubkey: PublicKey): Promise<string> {
        try {
            const [swapDelegate] = this.getPDA("swap_authority", userPubkey);

            const tx = await this.program.methods
                .transferSol(new anchor.BN(amount))
                .accounts({
                    from: userPubkey,
                    to: traderPubkey,
                })
                .transaction();

            const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
            tx.recentBlockhash = blockhash;
            tx.feePayer = this.provider.wallet.publicKey;

            const txSig = await sendAndConfirmTransaction(
                this.connection,
                tx,
                [this.provider.wallet.payer!],
                { skipPreflight: true }
            );

            console.log("✅ SOL transfer confirmed:", txSig);
            return txSig;

        } catch (error) {
            console.error("❌ Error in transferSol:", error);
            throw error;
        }
    }

    getPDA(seed: string, pubkey: anchor.web3.PublicKey): [PublicKey, number] {
        return this.rewardTraderClient.getPDA(seed, pubkey);
    }

    async getFollowersByTrader(traderPublicKey: PublicKey): Promise<string[]> {
      try {
        console.log("📋 Fetching trader's follower list...")
        console.log("   Trader:", traderPublicKey.toString())

        const [followListPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("follow_list"), traderPublicKey.toBuffer()],
          this.program.programId
        );
        
        console.log("   Follow List PDA:", followListPda.toString())
        
        const followList = await this.program.account.listOfFollow.fetch(followListPda);
        const followers = followList.follows.map(pk => pk.toBase58());
        
        console.log("✅ Follower list retrieved successfully")
        console.log("   Total followers:", followers.length)
        console.log("   Followers:", followers)
        
        return followers
      } catch (error) {
          console.error("❌ Error fetching follower list:")
          console.error("   Trader:", traderPublicKey.toString())
          console.error("   Error details:", error instanceof Error ? error.message : String(error))
          throw error;
      }
    }

  async getPoteBalance(publicKey:PublicKey): Promise<number> {
    try {
      const [potePda] = this.getPDA("pote", publicKey);
  
      const poteAccount = await this.program.account.apport.fetch(potePda);
  
      const balance = poteAccount.amount
  
      console.log(`Pote PDA: ${potePda.toBase58()}`);
      console.log(`Saldo do pote: ${balance}`);
  
      return balance;

    }catch (error) {
      console.error("error ->",error)
      throw error
    }
    
  }
}