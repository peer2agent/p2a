import dotenv from "dotenv";
import { TraderBotConfigDTO } from "../dto/TraderBotConfigDTO";
import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { QuoteResponse } from "@jup-ag/api";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import { NextTradeDTO } from "../dto/NextTradeDTO";
import { LogSwapArgsDTO } from "../dto/LogSwapArgsDTO";
import { SwapToken } from "../enum/SwapToken";

export class TradeBotImpl {
  private solanaConnection: Connection;
  private wallet: Keypair;
  private usdcMint: PublicKey;
  private solMint: PublicKey;
  private usdcTokenAccount: PublicKey;
  private solBalance: number = 0;
  private usdcBalance: number = 0;
  private checkInterval: number = 1000 * 10;
  private lastCheck: number = 0;
  private priceWatchIntervalId?: NodeJS.Timeout;
  private targetGainPercentage: number = 1;
  private nextTrade: NextTradeDTO;
  private waitingForConfirmation: boolean = false;
  // private generateSwap: GenerateSwapSerum;

  constructor(config: TraderBotConfigDTO) {
    const {
      solanaEndpoint,
      secretKey,
      targetGainPercentage,
      checkInterval,
      initialInputToken,
      initialInputAmount,
      firstTradePrice,
      usdcMint,
      solMint,
    } = config;

    this.solanaConnection = new Connection(solanaEndpoint);
    // this.generateSwap = new GenerateSwapSerum(config);
    this.wallet = Keypair.fromSecretKey(secretKey);
    this.usdcMint = usdcMint!!;
    this.solMint = solMint!!;

    this.usdcTokenAccount = getAssociatedTokenAddressSync(
      this.usdcMint,
      this.wallet.publicKey
    );
    if (targetGainPercentage) {
      this.targetGainPercentage = targetGainPercentage;
    }
    if (checkInterval) {
      this.checkInterval = checkInterval;
    }
    this.nextTrade = {
      inputMint:
        initialInputToken === SwapToken.SOL
          ? this.solMint.toBase58()
          : this.usdcMint.toBase58(),
      outputMint:
        initialInputToken === SwapToken.SOL
          ? this.usdcMint.toBase58()
          : this.solMint.toBase58(),
      amount: initialInputAmount,
      nextTradeThreshold: firstTradePrice,
    };
  }

  async init(): Promise<void> {
    console.log(
      `🤖 Initiating arb bot for wallet: ${this.wallet.publicKey.toBase58()}.`
    );
    await this.refreshBalances();
    console.log(
      `🏦 Current balances:\nSOL: ${
        this.solBalance / LAMPORTS_PER_SOL
      },\nUSDC: ${this.usdcBalance}`
    );
    this.initiatePriceWatch();
  }

  private async refreshBalances(): Promise<void> {
    try {
      const results = await Promise.allSettled([
        this.solanaConnection.getBalance(this.wallet.publicKey),
        this.solanaConnection.getTokenAccountBalance(this.usdcTokenAccount),
      ]);

      const solBalanceResult = results[0];
      const usdcBalanceResult = results[1];

      if (solBalanceResult.status === "fulfilled") {
        this.solBalance = solBalanceResult.value;
      } else {
        console.error("Error fetching SOL balance:", solBalanceResult.reason);
      }

      if (usdcBalanceResult.status === "fulfilled") {
        this.usdcBalance = usdcBalanceResult.value.value.uiAmount ?? 0;
      } else {
        this.usdcBalance = 0;
      }

      if (this.solBalance < LAMPORTS_PER_SOL / 100) {
        this.terminateSession("Low SOL balance.");
      }
    } catch (error) {
      console.error("Unexpected error during balance refresh:", error);
    }
  }

  //monitora o preço
  private initiatePriceWatch(): void {
    this.priceWatchIntervalId = setInterval(async () => {
      const currentTime = Date.now();
      if (currentTime - this.lastCheck >= this.checkInterval) {
        this.lastCheck = currentTime;
        try {
          if (this.waitingForConfirmation) {
            console.log("Waiting for previous transaction to confirm...");
            return;
          }
          // const quote = await this.generateSwap.getQuote(this.nextTrade);
          // this.evaluateQuoteAndSwap(quote);
        } catch (error) {
          console.error("Error getting quote:", error);
        }
      }
    }, this.checkInterval);
  }

  private async evaluateQuoteAndSwap(quote: QuoteResponse): Promise<void> {
    let difference =
      (parseInt(quote.outAmount) - this.nextTrade.nextTradeThreshold) /
      this.nextTrade.nextTradeThreshold;
    console.log(
      `📈 Current price: ${quote.outAmount} is ${
        difference > 0 ? "higher" : "lower"
      } than the next trade threshold: ${
        this.nextTrade.nextTradeThreshold
      } by ${Math.abs(difference * 100).toFixed(2)}%.`
    );
    if (parseInt(quote.outAmount) > this.nextTrade.nextTradeThreshold) {
      try {
        this.waitingForConfirmation = true;
        // var txid =  await this.generateSwap.executeSwap(quote);
        // await this.postTransactionProcessing(quote, txid);
      } catch (error) {
        console.error("Error executing swap:", error);
      } finally {
        this.waitingForConfirmation = false;
      }
    }
  }

  private async updateNextTrade(lastTrade: QuoteResponse): Promise<void> {
    const priceChange = this.targetGainPercentage / 100;
    this.nextTrade = {
      inputMint: this.nextTrade.outputMint,
      outputMint: this.nextTrade.inputMint,
      amount: parseInt(lastTrade.outAmount),
      nextTradeThreshold: parseInt(lastTrade.inAmount) * (1 + priceChange),
    };
  }

  private async logSwap(args: LogSwapArgsDTO): Promise<void> {
    const { inputToken, inAmount, outputToken, outAmount, txId, timestamp } =
      args;
    const logEntry = {
      inputToken,
      inAmount,
      outputToken,
      outAmount,
      txId,
      timestamp,
    };

    const filePath = path.join(__dirname, "trades.json");

    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(
          filePath,
          JSON.stringify([logEntry], null, 2),
          "utf-8"
        );
      } else {
        const data = fs.readFileSync(filePath, { encoding: "utf-8" });
        const trades = JSON.parse(data);
        trades.push(logEntry);
        fs.writeFileSync(filePath, JSON.stringify(trades, null, 2), "utf-8");
      }
      console.log(
        `✅ Logged swap: ${inAmount} ${inputToken} -> ${outAmount} ${outputToken},\n  TX: ${txId}}`
      );
    } catch (error) {
      console.error("Error logging swap:", error);
    }
  }

  private terminateSession(reason: string): void {
    console.warn(`❌ Terminating bot...${reason}`);
    console.log(
      `Current balances:\nSOL: ${this.solBalance / LAMPORTS_PER_SOL},\nUSDC: ${
        this.usdcBalance
      }`
    );
    if (this.priceWatchIntervalId) {
      clearInterval(this.priceWatchIntervalId);
      this.priceWatchIntervalId = undefined; // Clear the reference to the interval
    }
    setTimeout(() => {
      console.log("Bot has been terminated.");
      process.exit(1);
    }, 1000);
  }

  private async postTransactionProcessing(
    quote: QuoteResponse,
    txid: string
  ): Promise<void> {
    const { inputMint, inAmount, outputMint, outAmount } = quote;
    await this.updateNextTrade(quote);
    await this.refreshBalances();
    await this.logSwap({
      inputToken: inputMint,
      inAmount,
      outputToken: outputMint,
      outAmount,
      txId: txid,
      timestamp: new Date().toISOString(),
    });
  }
}
