import cors from "cors";
import express from "express";
import { TrackingWalletUseCase } from "../../usecase/impl/TrackingWalletUseCase";
import dotenv from "dotenv";
import { TraderBotUseCase } from "../../usecase/impl/TraderBotUseCase";
import { RealiseSwap } from "../../usecase/impl/RealiseSwapUseCase";
import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";
import { TransactionProcessorUseCase } from "../../usecase/impl/TransactionProcessorUseCase";
import { WalletTrackerImpl } from "../../wallet-tracker-service/impl/WalletTrackerImpl";
import { Webhook } from "helius-sdk";
import { JupiterClientSwap } from "../../trade-token-service/client/JupiterClientSwap";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
dotenv.config();

const app = express();

app.use(express.json());

// Configurar CORS para permitir a origem do frontend
app.use(
  cors({
    origin: "*", // Origem do frontend
    methods: ["*"],       // Métodos permitidos
    allowedHeaders: ["*"], // Cabeçalhos permitidos
  })
);

app.post("/tracking", async (req, res) => {

  var message = req.body

  var tracker = new TrackingWalletUseCase();

  var distribution = await tracker.usecase(message);

  res.send(distribution);

});

app.post("/start-bot", (req, res) => {

  var bot = new TraderBotUseCase();

  bot.usecase(req.body);

  res.send("Bot is started");
})

app.post("/realise-trade", async (req, res) => {

  var realiseSwap = new RealiseSwap();
  
  var tracking: TrackingInfoInputDTO = req.body
  
  await realiseSwap.usecase(tracking);

  res.send("ok");
})

app.post("/test", async (req, res) => {
  const url = "https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=D5ZA9HSXrdoRFxNnUyki6NAd3sUrpZF72Hmda5M4xyBt&amount=10016&slippageBps=1"
  const response = await fetch(url)
  const data = await response.json()
  console.log("olha data",data)
  var x = {
    inAmount: data.inAmount,
    otherAmountThreshold: data.otherAmountThreshold,
    quoteResponse: data
  }

  const quoteResponse=x.quoteResponse
    
  const swapResponse = await (
      await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // quoteResponse from /quote api
          quoteResponse,
          // user public key to be used for the swap
          userPublicKey: "BrSe6VQsP2noN7RQ215aNYt8ZN33QyHQkdpBbGott9ro",
          // auto wrap and unwrap SOL. default is true
          wrapAndUnwrapSol: true,
          // Optional, use if you want to charge a fee.  feeBps must have been passed in /quote API.
          feeAccount: "BrSe6VQsP2noN7RQ215aNYt8ZN33QyHQkdpBbGott9ro",

          prioritizationFeeLamports: 20000
        })
      })
    ).json();

    const { swapTransaction, lastValidBlockHeight } = swapResponse;

    const keypairBase58 = process.env.SECRET_KEY!!;

    const keypairBytes = bs58.decode(keypairBase58);

    

    var jupiter = new JupiterClientSwap(new Connection("https://api.mainnet-beta.solana.com"), false)

    var txid = await jupiter.sendTransaction(swapTransaction, Keypair.fromSecretKey(keypairBytes), lastValidBlockHeight)

    res.send(txid)
})


app.post("/p2a", (req, res) => {
  console.log("------------------New transaction-----------------")
  try {

    const processor = new TransactionProcessorUseCase(process.env.TRACKED_WALLET!!);
    const transaction = processor.processWebhook(req.body);
    
    if (!transaction) {
      console.log("Unrecognized transaction data:", JSON.stringify(req.body, null, 2));
      res.status(200).json({
        status: "success",
        message: "Unrecognized transaction logged"
      });
      return;
    }

    console.log("Processed Transaction:", JSON.stringify(transaction, null, 2));

    res.status(200).json({
      status: "success",
      data: transaction
    });

  } catch (err: unknown) {
    console.log("Unprocessable transaction data:", JSON.stringify(req.body, null, 2));
    res.status(200).json({
      status: "success",
      message: "Unprocessable transaction logged"
    });
  }
});


function formatTimestamp(): string {
  return new Date().toISOString();
}

const port = 3000; // Defina a porta que deseja usar
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
