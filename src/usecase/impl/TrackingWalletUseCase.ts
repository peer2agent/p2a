import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";
import { TrackingService } from "../../output/service/TrackingService";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";

export class TrackingWalletUseCase implements TrackingService {
    
    async usecase(trackingInfoInputDTO:TrackingInfoInputDTO): Promise<any> {
        
        const trackingInfo = new WalletTrackerImpl();
        
        return await trackingInfo.initiateServer(trackingInfoInputDTO);
    }

}