import { HistorySwapTokenDTO } from "./HistorySwapTokenDTO";

export interface WalletDTO {
  filteredTokens : HistorySwapTokenDTO[],
  usdBalance: number
}