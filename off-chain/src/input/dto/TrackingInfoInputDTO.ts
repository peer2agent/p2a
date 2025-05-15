
import {PublicKey} from "@solana/web3.js";

export interface TrackingInfoInputDTO {
    walletOwner: PublicKey
    trackedWallet: ListTrackerDTO[];
    webhookURL: string;
    isSimulation: boolean;
}

export interface ListTrackerDTO {
    wallet : string;
    value: number;
}