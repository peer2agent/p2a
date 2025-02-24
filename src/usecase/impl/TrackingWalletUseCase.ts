import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";
import { HistorySwapTokenDTO } from "../../wallet-tracker-service/dto/HistorySwapTokenDTO";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { TrackingService } from "../../output/service/TrackingService";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletDTO } from "../../wallet-tracker-service/dto/WalletDTO";

export class TrackingWalletUseCase implements TrackingService {
    
    async usecase(trackingInfoInputDTO:TrackingInfoInputDTO): Promise<any[]> {
        
        const trackingInfo = new WalletTrackerImpl(trackingInfoInputDTO.apiKey,trackingInfoInputDTO.webhookURL);
        
        var trackingTokens:WalletDTO[] = []

        await Promise.all(trackingInfoInputDTO.trackedWallet.map(async (wallet) => {
            var walletDTO = await trackingInfo.initiateServer(wallet.wallet)
            
            trackingTokens.push(walletDTO)
            
            ;
                        
        }))
        
        return trackingTokens
    }

}