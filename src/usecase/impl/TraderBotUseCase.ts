import { TraderBotImpl } from "../../trade-token-service/impl/TraderBotImpl";
import { TraderBotConfigDTO } from "../../trade-token-service/dto/TraderBotConfigDTO";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";
import { SwapToken } from "../../trade-token-service/enum/SwapToken";
import bs58 from 'bs58';

export class TraderBotUseCase {
   async usecase(
    trackingInfoInputDTO: TrackingInfoInputDTO
  ): Promise<any> {
    
    const trackingInfo = new WalletTrackerImpl(trackingInfoInputDTO.apiKey, trackingInfoInputDTO.webhookURL);
    
    const keypairBase58 = process.env.SECRET_KEY!!;
    const keypairBytes = bs58.decode(keypairBase58);
    const walletOwner = Keypair.fromSecretKey(keypairBytes);
    
    try{

        trackingInfoInputDTO.trackedWallet.map(async (wallet) => {

          var walletDTO = await trackingInfo.initiateServer(wallet.wallet);

          var swapHistory = walletDTO.filteredTokens

          swapHistory.map((token)=>{
          
          if (!token.id || token.id.length < 32 || token.id.length > 44) {
            console.error(`Skipping swap: Invalid token ID - ${token.id}`);
            return;
          }

          const outputMint = new PublicKey(token.id);

          const swapAmount = Number(wallet.value * (token.percentage/100) * LAMPORTS_PER_SOL);

          if (!swapAmount || swapAmount <= 0) {
            console.warn(`Skipping swap due to low amount: ${swapAmount}`);
            return;
          }

          console.log(`Realise Swap: ${wallet.wallet} --> ${swapAmount}`);

          var traderBotConfig: Partial<TraderBotConfigDTO> = {
            solanaEndpoint: trackingInfoInputDTO.configTrade,
            metisEndpoint: "https://public.jupiterapi.com",
            secretKey: walletOwner.secretKey,
            targetGainPercentage: 200,
            initialInputToken: SwapToken.SOL,
            initialInputAmount: swapAmount , 
            tokenMint: outputMint,
            isSimulation: trackingInfoInputDTO.isSimulation,
          };

          new TraderBotImpl(traderBotConfig as TraderBotConfigDTO).init();      
      });
    
    })

    return "Bot Trade initiated";
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error during BotTrade execution.`, error);
  }
}
}
