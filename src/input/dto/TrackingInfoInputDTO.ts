export interface TrackingInfoInputDTO {
    apiKey: string;
    trackedWallet: ListTrackerDTO[];
    webhookURL: string;
    configTrade?: string;
}

export interface ListTrackerDTO {
    wallet : string;
    value: number;
}