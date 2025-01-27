import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";
import { TrackingService} from "../../output/service/TrackingService";
import { HistorySwapTokenDTO } from "../../wallet-tracker-service/dto/HistorySwapTokenDTO";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";

export class TrackingWalletUseCase implements TrackingService {
    
    async usecase(trackingInfoInputDTO:TrackingInfoInputDTO): Promise<HistorySwapTokenDTO[]> {
        
        const trackingInfo = new WalletTrackerImpl(trackingInfoInputDTO.apiKey,trackingInfoInputDTO.webhookURL);
        
        var trackingTokens:HistorySwapTokenDTO[]  =[]

        await Promise.all(
            trackingInfoInputDTO.trackedWallet.map(async (wallet) => {
                var x =await trackingInfo.initiateServer(wallet.wallet);
                trackingTokens.push(...x)

            })
            );

        return await trackingTokens
    }

}