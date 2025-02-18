
import {PublicKey} from "@solana/web3.js";

export interface TrackingInfoInputDTO {
    walletOwner: PublicKey
    apiKey: string;
    trackedWallet: ListTrackerDTO[];
    webhookURL: string;
    configTrade?: string;
    isSimulation: boolean;
}

export interface ListTrackerDTO {
    wallet : string;
    value: number;
}