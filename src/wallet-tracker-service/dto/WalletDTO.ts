import { HistorySwapTokenDTO } from "./HistorySwapTokenDTO";

export interface WalletDTO {
  tokens : HistorySwapTokenDTO[],
  usdBallance: number
}