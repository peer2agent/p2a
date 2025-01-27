import { TradeBotImpl } from "../../trade-token-service/impl/TradeBotImpl";
import { TraderBotConfigDTO } from "../../trade-token-service/dto/TraderBotConfigDTO";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";
import { SwapToken } from "../../trade-token-service/enum/SwapToken";

export class BotTradeUseCase {
  public async usecase(
    trackingInfoInputDTO: TrackingInfoInputDTO
  ): Promise<any> {
    const walletOwner = Keypair.generate();

    var trackingInfo = new WalletTrackerImpl(trackingInfoInputDTO.apiKey, trackingInfoInputDTO.webhookURL);

    var listOfSwap: TraderBotConfigDTO[] = [];

    try{
      await Promise.all(trackingInfoInputDTO.trackedWallet.map(async (wallet) => {
        wallet.wallet

        var swapHistory = await trackingInfo.initiateServer(wallet.wallet);
        
        swapHistory.map((token)=>{
          var traderBotConfig: TraderBotConfigDTO = {
            solanaEndpoint: trackingInfoInputDTO.configTrade!!, // e.g., "https://ex-am-ple.solana-mainnet.quiknode.pro/123456/"
            metisEndpoint: "https://public.jupiterapi.com", // e.g., "https://jupiter-swap-api.quiknode.pro/123456/"
            secretKey: walletOwner.secretKey,
            firstTradePrice: 1,
            targetGainPercentage: 1.5,
            initialInputToken: SwapToken.SOL,
            initialInputAmount: wallet.value * token.percentage, //TODO deixar dinamico
            usdcMint: new PublicKey(token.id),
            solMint: new PublicKey("So11111111111111111111111111111111111111112"),
          };

          listOfSwap.push(traderBotConfig)      
        
      });
    
    }))
    
    console.log("Public Key:", walletOwner.publicKey.toBase58());
    console.log("Secret Key:", Array.from(walletOwner.secretKey));

    listOfSwap.map((swapConfig) => {
      new TradeBotImpl(swapConfig).init();
    })

    
    } catch(error){
      console.error(`[${new Date().toISOString()}] Error during BotTrade execution.`, error);
    
    }finally {
      return "initiated"
    }
  }
}
