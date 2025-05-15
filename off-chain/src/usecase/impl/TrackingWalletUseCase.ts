import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { TrackingService } from "../../output/service/TrackingService";
import { WalletDTO } from "../../wallet-tracker-service/dto/WalletDTO";

export class TrackingWalletUseCase implements TrackingService {
    
    async usecase(walletsToTraker:string[]): Promise<any[]> {
        
        var trackingTokens:WalletDTO[] = []
        
        var wallets = walletsToTraker
        
        const trackingInfo = new WalletTrackerImpl();

        await trackingInfo.createWebhook(wallets);

        console.log(`\n[${new Date().toISOString()}] Wallets to track: ${wallets}`);
        
        await Promise.all(wallets.map(async (wallet) => {
            console.log(`\nStarting fetch for wallet: ${wallet}`);
            
            trackingTokens.push(await trackingInfo.getDistribution(wallet))
        
        }))
        
        return trackingTokens
    }

}