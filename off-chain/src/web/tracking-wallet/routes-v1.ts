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
import { PDAImpl } from "../../smart-contract-service/impl/PDAImpl";
import { UserImpl } from "../../smart-contract-service/impl/UserImpl";


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

  var {walletsToTraker} = req.body

  var tracker = new TrackingWalletUseCase();

  var distribution = await tracker.usecase(walletsToTraker);

  res.send(distribution);

});


app.post("/realise-trade", async (req, res) => {

  var realiseSwap = new RealiseSwapByJupiterUseCase();
  
  var tracking: TrackingInfoInputDTO = req.body
  
  await realiseSwap.usecase(tracking);

  res.send("ok");
})


app.post("/p2a", (req:any, res:any) => {
  console.log("------------------New transaction-----------------")
  try {

    const webhookData = req.body as any[];
    if (!Array.isArray(webhookData) || webhookData.length === 0) {
      console.warn("Body vazio ou não é um array:", webhookData);
      return res.status(400).json({ status: "error", message: "Invalid webhook payload" });
    }

    // 2) Pegamos o primeiro elemento
    const payload = webhookData[0];

    // 3) Extraímos a publicKey de quem fez o swap
    const userPubKeyStr = payload.events?.swap?.nativeInput?.account;
    if (!userPubKeyStr) {
      console.error("Não encontrei a publicKey no payload:", JSON.stringify(payload, null, 2));
      throw new Error("Não consegui encontrar a publicKey do swap no payload");
    }

    const processor = new TransactionProcessorUseCase(userPubKeyStr);
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
    const { secretKey, amount } = req.body;
    if (!secretKey) {
      return res.status(400).json({
        status: "error",
        message: "Secret key is required"
      });
    }

    const keypairBytes = bs58.decode(secretKey);
    const keypair = Keypair.fromSecretKey(keypairBytes);
    
    const sendReconpenseToTrader = new UserBalanceUseCase(keypair);
    await sendReconpenseToTrader.execute(amount);

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
    const { secretKey } = req.body;

    const keypairBytes = bs58.decode(secretKey);
    
    const keypair = Keypair.fromSecretKey(keypairBytes);
    
    const initializeTraderUseCase = new InitializeTraderUseCase();
    
    console.log("🚀 Starting trader initialization process...")
    
    const phantomImportString = bs58.encode(keypair.secretKey);
    
    console.log("✅ Phantom import format:", phantomImportString);
    
    await initializeTraderUseCase.execute(keypair);

    res.send({ message: "✅ Trader initialized successfully\n   Ready to accept followers and execute trades" });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error,
    });
  }
});

app.post("/trader/followers", async (req, res) => {
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
    
    const initializeTraderUseCase = await new InitializeTraderUseCase();
    
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


app.put("/user/apport", async (req:any, res:any) => {
  try {
    const { publicKey } = req.body;
    if (!publicKey) {
      return res.status(400).json({
        status: "error",
        message: "Public key is required"
      });
    }

    const pote = await new PDAImpl().getPoteBalance(publicKey);

    res.send({
      message: "Apport amount retrieved successfully",
      amount: pote
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

app.post("/transfer-sol", async (req:any, res:any) => {
  try {
    const { secretKey, amount, traderPublicKey } = req.body;
    if (!secretKey || !amount || !traderPublicKey) {
      return res.status(400).json({
        status: "error",
        message: "Secret key, amount, and trader public key are required"
      });
    }

    const keypairBytes = bs58.decode(secretKey);
    const keypair = Keypair.fromSecretKey(keypairBytes);
    const traderPk = new PublicKey(traderPublicKey);

    const pda = new PDAImpl();
    const txSig = await pda.transferSol(keypair.publicKey, amount, traderPk);

    res.send({
      message: "SOL transferred successfully",
      transactionSignature: txSig
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
});

app.post("/user/make-deposit", async (req:any, res:any) => {
  try {
    const { amount } = req.body;
    if ( amount === undefined) {
      return res.status(400).json({
        status: "error",
        message: "amount are required"
      });
    }

    const pda = new PDAImpl();
    await pda.makeDeposit(amount);

    res.send({
      message: "Deposit made successfully",
    });

  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
});

