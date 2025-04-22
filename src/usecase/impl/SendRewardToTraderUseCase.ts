import {
    Keypair
} from "@solana/web3.js";
import { RewardTraderImpl } from "../../reward-trader-service/impl/RewardTraderImpl";
import fs from 'mz/fs';
import path from 'path';

const RECIPIENT_KEYPAIR_PATH = path.join(__dirname, "../../../payer.json")

export class SendRewardToTraderUseCase {
    private user :string 


    constructor(user:string) {
        this.user = user
    }
    
    async usecase(amount:number, recipient: String) {
        
        try {
            
            var rewardTraderImpl = new RewardTraderImpl(this.user, await this.getPayer())
            rewardTraderImpl.sendTokenToTrader(amount,recipient)

        } catch (error) {
            console.error("Erro ao enviar transação:", error);
        }
    }


    async getPayer(): Promise<Keypair> {
        const secretKeyString = await fs.readFile(RECIPIENT_KEYPAIR_PATH, { encoding: 'utf8' });
        const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
        return Keypair.fromSecretKey(secretKey);
    }



   
}
