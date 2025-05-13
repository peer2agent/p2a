import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { TrackingService } from "../../output/service/TrackingService";
import { WalletDTO } from "../../wallet-tracker-service/dto/WalletDTO";

export class TrackingWalletUseCase implements TrackingService {
    
    async usecase(trackingInfoInputDTO:TrackingInfoInputDTO): Promise<any[]> {
        
        var trackingTokens:WalletDTO[] = []
        
        var wallets = trackingInfoInputDTO.trackedWallet.map(wallets => wallets.wallet)
        
        const trackingInfo = new WalletTrackerImpl();

        await trackingInfo.createWebhook(wallets);
        
        await Promise.all(trackingInfoInputDTO.trackedWallet.map(async (wallet) => {
            
            trackingTokens.push(await trackingInfo.getDistribution(wallet.wallet))
        }))
        
        return trackingTokens
    }

}