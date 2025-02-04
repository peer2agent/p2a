import { TraderBotConfigDTO } from "../dto/TraderBotConfigDTO";
import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { QuoteResponse, ResponseError } from "@jup-ag/api";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import { NextTradeDTO } from "../dto/NextTradeDTO";
import { LogSwapArgsDTO } from "../dto/LogSwapArgsDTO";
import { SwapToken } from "../enum/SwapToken";
import { JupiterClientSwap } from "../client/JupiterClientSwap";
import { SwapInfoDTO } from "../dto/SwapInfoDTO";

export class TraderBotImpl {
    private solanaConnection: Connection;
    private wallet: Keypair;
    private tokenMint: PublicKey;
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
    private jupyterClient: JupiterClientSwap;
    private isSolInput: boolean = true;
    private firstTrade: boolean = true;

    constructor(config: TraderBotConfigDTO) {
      const {
        solanaEndpoint,
        secretKey,
        targetGainPercentage,
        checkInterval,
        initialInputToken,
        initialInputAmount,
        tokenMint,
        isSimulation
      } = config;
      
      this.solanaConnection = new Connection(solanaEndpoint);
      

      this.jupyterClient = new JupiterClientSwap(this.solanaConnection,isSimulation)
      
      this.solMint = new PublicKey("So11111111111111111111111111111111111111112");
      
      this.tokenMint = tokenMint!!;

      this.wallet = Keypair.fromSecretKey(secretKey);
      
      this.usdcTokenAccount = getAssociatedTokenAddressSync(this.tokenMint,this.wallet.publicKey);
      
      if (targetGainPercentage) {
        this.targetGainPercentage = targetGainPercentage;
      }
      
      if (checkInterval) {
        this.checkInterval = checkInterval;
      }
      
       
      this.isSolInput = initialInputToken === SwapToken.SOL,

      this.nextTrade = {
        inputMint:initialInputToken === SwapToken.SOL ? this.solMint.toBase58() : this.tokenMint.toBase58(),
        outputMint:initialInputToken === SwapToken.SOL ? this.tokenMint.toBase58() : this.solMint.toBase58(),
        amount: Math.floor(initialInputAmount ), //entrada para o swap 
        lastTokenTradeValue: 0,
        lastSolTradeValue: 0
      };
    
    }

    async init(){
      console.log(`🤖 Initiating arb bot for wallet: ${this.wallet.publicKey.toBase58()}.`);
      
      await this.refreshBalances();
      
      console.log(`🏦 Current balances:\nSOL: ${this.solBalance / LAMPORTS_PER_SOL},\nUSDC: ${this.usdcBalance}`);
      
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

    //monitora o preço (fica rodando e fazendo o swap)
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
            const swapInfo = await this.jupyterClient.fetchSwapInfo(this.nextTrade.inputMint,this.nextTrade.outputMint,this.nextTrade.amount) 
            this.evaluateQuoteAndSwap(swapInfo);
          } catch (error) {

            console.error(`[${new Date().toISOString()}] - c=${TraderBotImpl.name} m=initiatePriceWatch error=${error}`);
            //TODO mandar para algum lugar falando que deu erro

            clearInterval(this.priceWatchIntervalId)
          }
        }
      }, this.checkInterval);
    }


    private async evaluateQuoteAndSwap(swapInfo:SwapInfoDTO): Promise<void> {

      const usdAmount = parseFloat(swapInfo.quoteResponse.swapUsdValue)

      var a = this.isSolInput? this.nextTrade.lastSolTradeValue : this.nextTrade.lastTokenTradeValue;

      const difference = ( usdAmount - a) / a;

      //é uma compra com solona ?
          // se a ultima compra com solana é mais barata que a atual retorna -> true ;
          // se a ultima compra com solana é mais cara que a atual retorna -> false ;
      //é uma venda do token para solana ?
          // se a ultima venda com token é mais cara que a atual retorna -> true
          // se a ultima venda com token é mais barata que a atual retorna -> false ;
      
      const target = (this.nextTrade.lastTokenTradeValue) * (1 + (this.targetGainPercentage / 100)); 

      const targetToken =  usdAmount >= target;
      
      const targetSol = (this.nextTrade.lastSolTradeValue) <= usdAmount || this.firstTrade ;

      const realiseTrade = this.isSolInput ? targetSol : targetToken;

      console.log("------------------------------------------------------------------------------------")

      console.log(`Você vai comprar ${Number(swapInfo.quoteResponse.outAmount).toFixed(10)} de ${this.nextTrade.outputMint}`)
      
      console.log(`No ultimo trade você comprou à : ${this.nextTrade.lastTokenTradeValue}`);

      console.log(`no valor de ${Number(swapInfo.quoteResponse.inAmount).toFixed(10)} de ${this.nextTrade.inputMint}`)
      
      console.log("------------------------------------------------------------------------------------")

      console.log(`📈 Current price: ${usdAmount} is ${difference > 0 ? 'higher' : 'lower'} than the next trade threshold: ${a} by ${Math.abs(difference * 100).toFixed(2)}%.`);
      
      if (realiseTrade) {
        try {
          this.waitingForConfirmation = true;
          await this.executeSwap(swapInfo,swapInfo.quoteResponse);
      } catch (error) {
          console.error('Error executing swap:', error);
      }
    }
  }

  
  async executeSwap(swapInfo:SwapInfoDTO,route: QuoteResponse): Promise<void> {
      try {

        const {swapTransaction, lastValidBlockHeight} = await this.jupyterClient.fetchSwapTransaction(this.wallet, swapInfo)
          
        var txid = await this.jupyterClient.sendTransaction(swapTransaction,this.wallet, lastValidBlockHeight)
          
        await this.postTransactionProcessing(route, txid);
          
        } catch (error) {
          if (error instanceof ResponseError) {
            console.log(await error.response.json());
          }
          else {
            console.error(error);
            }
          throw new Error('Unable to execute swap');
        } finally {
          this.waitingForConfirmation = false;
          this.firstTrade = false;
          this.isSolInput = !this.isSolInput;
        }
      }
  
  private terminateSession(reason: string): void {
    console.warn(`❌ Terminating bot...${reason}`);
    console.log(`Current balances:\nSOL: ${this.solBalance / LAMPORTS_PER_SOL},\nUSDC: ${this.usdcBalance}`);
    if (this.priceWatchIntervalId) {
      clearInterval(this.priceWatchIntervalId);
      this.priceWatchIntervalId = undefined;
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
  
  private async updateNextTrade(lastTrade: QuoteResponse): Promise<void> {
    this.nextTrade = {
      inputMint: this.nextTrade.outputMint,
      outputMint: this.nextTrade.inputMint,
      amount: Math.floor(parseInt(lastTrade.outAmount) * 0.3), // TODO -> calcular custo
      lastSolTradeValue: this.isSolInput? parseFloat(lastTrade.swapUsdValue!!) : this.nextTrade.lastSolTradeValue,
      lastTokenTradeValue: this.isSolInput? this.nextTrade.lastTokenTradeValue : parseFloat(lastTrade.swapUsdValue!!),
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
      console.log(`✅ Logged swap: ${inAmount} ${inputToken} -> ${outAmount} ${outputToken},\n  TX: ${txId}}`);
    } catch (error) {
      console.error("Error logging swap:", error);
    }
  }
}
