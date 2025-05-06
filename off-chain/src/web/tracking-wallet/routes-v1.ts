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

app.post("/user/apport", async (req, res) => {
  try {
    const keypairBase58 = process.env.SECRET_KEY!!;
    
    const keypairBytes = bs58.decode(keypairBase58);
    const keypair = Keypair.fromSecretKey(keypairBytes);
    console.log(keypair.publicKey.toString())

    console.log(keypair.publicKey.toString())

    const sendReconpenseToTrader = new UserBalanceUseCase(keypair);
    await sendReconpenseToTrader.execute(0.5);

    res.send({ message: "PDA on for" });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error,
    });
  }
});

app.post("/user/add-balance", async (req, res) => {
  try {
    const keypairBase58 = process.env.SECRET_KEY!!;
    const keypairBytes = bs58.decode(keypairBase58);
    const keypair = Keypair.fromSecretKey(keypairBytes);
    const amount = req.body.amount;


    const sendReconpenseToTrader = new UserBalanceUseCase(keypair);
    await sendReconpenseToTrader.addBalance(amount);

    res.send({ message: "PDA on for" });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error,
    });
  }
});

app.post("/trader/init-trader", async (req, res) => {
  try {
    const keypair = anchor.web3.Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(
        '/home/inteli/.config/solana/id.json', 'utf8'
      )))
  );    
    const initializeTraderUseCase = new InitializeTraderUseCase();
    await initializeTraderUseCase.execute(keypair);

    res.send({ message: "PDA on for" });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error,
    });
  }
});

app.post("/trader/followers", async (req, res) => {
  try {
    const keypair = anchor.web3.Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(
        '/home/inteli/.config/solana/id.json', 'utf8'
      )))
  );    
    const initializeTraderUseCase = new InitializeTraderUseCase();
    await initializeTraderUseCase.getFollowList(keypair.publicKey);

    res.send({ message: "PDA on for" });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error,
    });
  }
});

app.post("/executeSwap", async (req, res) => {
  try {

    const pk:PublicKey = req.body.publicKey
    const amount:number = req.body.amount
    const inputMintTokenAddress:PublicKey = new PublicKey(req.body.inputMintTokenAddress)
    const outputMintTokenAddress:PublicKey = new PublicKey(req.body.outputMintTokenAddress)

    var sendReconpenseToTrader = new RealiseSwapByPDAUseCase();

    const value = await sendReconpenseToTrader.execute(pk,amount,inputMintTokenAddress,outputMintTokenAddress);

    res.send({ message: "Pote criado!", poteAtual: value });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error,
    });
  }
});

const port = 3001; // Defina a porta que deseja usar
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
