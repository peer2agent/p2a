import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";

export interface TrackingService {
    usecase(trackingInfoInputDTO: string[]): Promise<any>;
}