import { Connection, Keypair,} from "@solana/web3.js";

import fs from 'mz/fs';
import path from 'path';

const PROGRAM_PATH = path.resolve(__dirname, '../../../dist/program');
const PROGRAM_KEYPAIR_PATH = path.join(PROGRAM_PATH, 'smart_contract-keypair.json');

export class RewardTraderClient {

    public connection: Connection;

    constructor() {
        this.connection = new Connection("http://localhost:8899", "confirmed");
    }

    async getKeyPair(): Promise<Keypair> {
        const secretKeyString = await fs.readFile(PROGRAM_KEYPAIR_PATH, { encoding: 'utf8' });
        const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
        return Keypair.fromSecretKey(secretKey);
    }


}