import { PublicKey } from "@solana/web3.js";
import { SwapToken } from "../enum/SwapToken";

export interface TraderBotConfigDTO {
    solanaEndpoint: string; // e.g., "https://ex-am-ple.solana-mainnet.quiknode.pro/123456/"
    metisEndpoint: string;  // e.g., "https://jupiter-swap-api.quiknode.pro/123456/"
    secretKey: Uint8Array;
    firstTradePrice: number; // e.g. 94 USDC/SOL
    targetGainPercentage?: number;
    checkInterval?: number;
    initialInputToken: SwapToken;
    initialInputAmount: number;
    usdcMint?: PublicKey ;
    solMint?: PublicKey ;
}

