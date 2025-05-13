
import * as fs from "fs";
import * as anchor from "@coral-xyz/anchor";
import {  Connection, PublicKey,} from "@solana/web3.js";
import { P2a } from "../../../../target/types/p2a";


export class RewardTraderClient {

    public program: anchor.Program<P2a>
    public connection: Connection
    public provider: anchor.AnchorProvider

    constructor() {
              
      const keypair = anchor.web3.Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(
          '/home/inteli/.config/solana/id.json', 'utf8'
        )))
      );
      
      const dummy = keypair;
      
      this.connection = new anchor.web3.Connection("http://127.0.0.1:8899", "confirmed")
      
      
      const provider = new anchor.AnchorProvider(
        this.connection,
        new anchor.Wallet(dummy),
        { commitment: "confirmed" }
      );

      this.provider = provider;

      anchor.setProvider(provider);
      
      
      const program = anchor.workspace.P2a as anchor.Program<P2a>;

      console.log("keypair", keypair) 
      
      this.program =program 
    }

    public getPDA(seed: string, pubkey: anchor.web3.PublicKey) {
      const anchorPubkey = new anchor.web3.PublicKey(pubkey.toString())
      return PublicKey.findProgramAddressSync(
        [Buffer.from(seed), anchorPubkey.toBuffer()],
        this.program.programId
      );
    }

}