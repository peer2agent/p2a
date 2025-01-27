import {JupiterImpl} from "../../trade-token-service/impl/JupiterSwapImpl";
import { Connection, Keypair, PublicKey} from "@solana/web3.js";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";


export class RealiseSwap {

    public async usecase(trackingInfoInputDTO:TrackingInfoInputDTO,): Promise<any> {

        var trackingInfo = new WalletTrackerImpl(trackingInfoInputDTO.apiKey, trackingInfoInputDTO.webhookURL)

        const walletOwner = Keypair.generate();

        console.log("Public Key:", walletOwner.publicKey.toBase58()); 
        console.log("Secret Key:", Array.from(walletOwner.secretKey));

        try {
            trackingInfoInputDTO.trackedWallet.map(async (wallet) => {
              wallet.wallet
      
              var swapHistory = await trackingInfo.initiateServer(wallet.wallet);

              console.log("Quantidade de swaps que serão realizados -> ", swapHistory.length)
              console.log("swapHistory -> ", swapHistory)

              swapHistory.map(async(token)=>{ 
                  
                  const trade = new JupiterImpl({
                      outputMintTokenAddress: new PublicKey(token.id),
                      inputMintTokenAddress: new PublicKey("So11111111111111111111111111111111111111112"),
                      ownerPublicKey: walletOwner.publicKey,
                      connection: new Connection(trackingInfoInputDTO.configTrade!!),
                      feeAccount: walletOwner.publicKey,
                      trackingAccount : walletOwner.publicKey
                  }, Keypair.generate());

                  console.log("Realise Swap: ", wallet.wallet ,"-->", wallet.value * token.percentage )
    
                  await trade.realiseSwap(wallet.value * token.percentage);
                  });
                }) 
            } 
        catch(error){
            console.error(`[${new Date().toISOString()}] Error during RealiseSwap execution.`, error);
        }
        finally {
            return "initiated"
        }
         
    }
}