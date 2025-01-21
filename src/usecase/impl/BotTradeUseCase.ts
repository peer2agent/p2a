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
    const wallet = Keypair.generate();

    var trackingInfo = new WalletTrackerImpl();

    var swapHistory = await trackingInfo.initiateServer(trackingInfoInputDTO);

    //TODO DEIXAR COMO ESCOLHER TOKEN ? ()
    var first = swapHistory[0].id;

    var traderBotConfig: TraderBotConfigDTO = {
      solanaEndpoint: trackingInfoInputDTO.configTrade!!, // e.g., "https://ex-am-ple.solana-mainnet.quiknode.pro/123456/"
      metisEndpoint: "https://public.jupiterapi.com", // e.g., "https://jupiter-swap-api.quiknode.pro/123456/"
      secretKey: wallet.secretKey,
      firstTradePrice: 1, // e.g. 94 USDC/SOL
      targetGainPercentage: 1.5,
      initialInputToken: SwapToken.SOL,
      initialInputAmount: 1000, //TODO deixar dinamico
      usdcMint: new PublicKey(first),
      solMint: new PublicKey("So11111111111111111111111111111111111111112"),
    };

    console.log("Public Key:", wallet.publicKey.toBase58());
    console.log("Secret Key:", Array.from(wallet.secretKey));

    const bot = new TradeBotImpl(traderBotConfig);

    return await bot.init();
  }
}
