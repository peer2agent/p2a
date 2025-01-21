import {JupiterImpl} from "../../trade-token-service/impl/JupiterSwapImpl";
import { Connection, Keypair, PublicKey} from "@solana/web3.js";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";


export class RealiseSwap {

    public async usecase(trackingInfoInputDTO:TrackingInfoInputDTO,): Promise<any> {

        var trackingInfo = new WalletTrackerImpl()

        var swapHistory = await trackingInfo.initiateServer(trackingInfoInputDTO)
        
        //TODO DEIXAR COMO ESCOLHER TOKEN ? ()
        swapHistory[0].id

        const wallet = Keypair.generate();

        console.log("Public Key:", wallet.publicKey.toBase58()); 
        console.log("Secret Key:", Array.from(wallet.secretKey));

        const trade = new JupiterImpl({
            outputMintTokenAddress: new PublicKey(swapHistory[0].id),
            inputMintTokenAddress: new PublicKey("So11111111111111111111111111111111111111112"),
            ownerPublicKey: wallet.publicKey,
            connection: new Connection(trackingInfoInputDTO.configTrade!!),
            feeAccount: wallet.publicKey,
            trackingAccount : wallet.publicKey
        }, Keypair.generate());
        
    
        //TODO DEIXAR VALUE DINAMICO ()
        return await trade.realiseSwap(1000);
    }

}