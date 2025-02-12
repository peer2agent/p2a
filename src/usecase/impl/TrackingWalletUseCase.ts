import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";
import { HistorySwapTokenDTO } from "../../wallet-tracker-service/dto/HistorySwapTokenDTO";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { TrackingService } from "../../output/service/TrackingService";

export class TrackingWalletUseCase implements TrackingService {
    
    async usecase(trackingInfoInputDTO:TrackingInfoInputDTO): Promise<HistorySwapTokenDTO[]> {
        
        const trackingInfo = new WalletTrackerImpl(trackingInfoInputDTO.apiKey,trackingInfoInputDTO.webhookURL);
        
        var trackingTokens:HistorySwapTokenDTO[]  =[]

        Promise.all(trackingInfoInputDTO.trackedWallet.map(async (wallet) => {
             trackingTokens.push(...await trackingInfo.initiateServer(wallet.wallet))
        }))

        return trackingTokens
    }

}