import cors from "cors";
import express from "express";
import { TrackingWalletUseCase } from "../../usecase/impl/TrackingWalletUseCase";
import dotenv from "dotenv";
import { RealiseSwapByJupiterUseCase } from "../../usecase/impl/RealiseSwapByJupiterUseCase";
import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";
import { TransactionProcessorUseCase } from "../../usecase/impl/TransactionProcessorUseCase";
import { RealiseSwapByPDAUseCase } from "../../usecase/impl/RealiseSwapByPDAUseCase";
import * as anchor from "@project-serum/anchor";
import * as fs from "fs";
import { Keypair, PublicKey } from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { InitializeTraderUseCase } from "../../usecase/impl/InitializeTraderUseCase";
import { UserBalanceUseCase } from "../../usecase/impl/UserBalanceUseCase";


dotenv.config();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["*"],
    allowedHeaders: ["*"],
  })
);

app.post("/tracking", async (req, res) => {

  var message = req.body

  var tracker = new TrackingWalletUseCase();

  var distribution = await tracker.usecase(message);

  res.send(distribution);

});


app.post("/realise-trade", async (req, res) => {

  var realiseSwap = new RealiseSwapByJupiterUseCase();
  
  var tracking: TrackingInfoInputDTO = req.body
  
  await realiseSwap.usecase(tracking);

  res.send("ok");
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

app.post("/user/apport", async (req:any, res:any) => {
  try {
    const { secretKey } = req.body;
    if (!secretKey) {
      return res.status(400).json({
        status: "error",
        message: "Secret key is required"
      });
    }

    const keypairBytes = bs58.decode(secretKey);
    const keypair = Keypair.fromSecretKey(keypairBytes);
    
    const sendReconpenseToTrader = new UserBalanceUseCase(keypair);
    await sendReconpenseToTrader.execute(0.5);

    res.send({ 
      message: "User initialized successfully",
      publicKey: keypair.publicKey.toString()
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
});

app.post("/user/add-balance", async (req:any, res:any) => {
  try {
    const { secretKey, amount } = req.body;
    if (!secretKey || amount === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Secret key and amount are required"
      });
    }

    const keypairBytes = bs58.decode(secretKey);
    const keypair = Keypair.fromSecretKey(keypairBytes);

    const sendReconpenseToTrader = new UserBalanceUseCase(keypair);
    await sendReconpenseToTrader.addBalance(amount);

    res.send({ 
      message: "Balance added successfully",
      publicKey: keypair.publicKey.toString()
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
});

app.post("/trader/init-trader", async (req, res) => {
  try {
    const keypair = anchor.web3.Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(
        '/home/inteli/Desktop/wallet-tracker-sol/trader.json', 'utf8'
      )))
  );    
    const initializeTraderUseCase = new InitializeTraderUseCase();
    console.log("trader ->",keypair.publicKey.toString())
    await initializeTraderUseCase.execute(keypair);

    res.send({ message: "PDA on for" });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error,
    });
  }
});

app.get("/trader/followers", async (req, res) => {
  try {
    const publicKey = new PublicKey(req.body.publicKey)
  
    const initializeTraderUseCase = new InitializeTraderUseCase();
    const list = await initializeTraderUseCase.getFollowList(publicKey);

    res.send(list);
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error,
    });
  }
});

app.post("/user/follow-trader", async (req:any, res:any) => {
  try {
    const { secretKey, traderPublicKey } = req.body;
    if (!secretKey || !traderPublicKey) {
      return res.status(400).json({
        status: "error",
        message: "Secret key and trader public key are required"
      });
    }

    const keypairBytes = bs58.decode(secretKey);
    const keypair = Keypair.fromSecretKey(keypairBytes);
    const publicKey = new PublicKey(traderPublicKey);

    const initializeTraderUseCase = new InitializeTraderUseCase();
    await initializeTraderUseCase.addFollow(keypair, publicKey);

    res.send({ 
      message: "Successfully followed trader",
      userPublicKey: keypair.publicKey.toString(),
      traderPublicKey: traderPublicKey
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
});

app.post("/executeSwap", async (req:any, res:any) => {
  try {
    const { secretKey, amount, inputMintTokenAddress, outputMintTokenAddress } = req.body;
    if (!secretKey || !amount || !inputMintTokenAddress || !outputMintTokenAddress) {
      return res.status(400).json({
        status: "error",
        message: "Secret key, amount, input token address, and output token address are required"
      });
    }

    const keypairBytes = bs58.decode(secretKey);
    const keypair = Keypair.fromSecretKey(keypairBytes);
    const inputMint = new PublicKey(inputMintTokenAddress);
    const outputMint = new PublicKey(outputMintTokenAddress);

    var sendReconpenseToTrader = new RealiseSwapByPDAUseCase();
    const value = await sendReconpenseToTrader.execute(keypair.publicKey, amount, inputMint, outputMint);

    res.send({ 
      message: "Swap executed successfully",
      result: value,
      publicKey: keypair.publicKey.toString()
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
});

const port = 3001; // Defina a porta que deseja usar
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


