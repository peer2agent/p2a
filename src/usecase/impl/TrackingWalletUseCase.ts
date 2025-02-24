import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";
import { HistorySwapTokenDTO } from "../../wallet-tracker-service/dto/HistorySwapTokenDTO";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { TrackingService } from "../../output/service/TrackingService";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export class TrackingWalletUseCase implements TrackingService {
    
    async usecase(trackingInfoInputDTO:TrackingInfoInputDTO): Promise<any[]> {
        
        const trackingInfo = new WalletTrackerImpl(trackingInfoInputDTO.apiKey,trackingInfoInputDTO.webhookURL);
        
        var trackingTokens:any[] = []

        await Promise.all(trackingInfoInputDTO.trackedWallet.map(async (wallet) => {
            var walletDTO = await trackingInfo.initiateServer(wallet.wallet)
            var tracking = walletDTO.tokens
            
            tracking.map((tracking) => {
                const x = {
                    id: tracking.id,
                    symbol: tracking.symbol,
                    userTotalPrice: tracking.totalPrice,
                    userQuantity: tracking.quantity,
                    userPercentage: tracking.percentage,
                    myAporte: wallet.value * (tracking.percentage/100)
                };
                trackingTokens.push(x);
            });
            
        }))
        
        return trackingTokens
    }

}