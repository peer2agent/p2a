import cors from "cors";
import express from "express";
import { TrackingWalletUseCase } from "../../usecase/impl/TrackingWalletUseCase";
import dotenv from "dotenv";
import { TraderBotUseCase } from "../../usecase/impl/TraderBotUseCase";
import { RealiseSwap } from "../../usecase/impl/RealiseSwapUseCase";
import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";
import { TransactionProcessorUseCase } from "../../usecase/impl/TransactionProcessorUseCase";

dotenv.config();

const app = express();

app.use(express.json());

// Configurar CORS para permitir a origem do frontend
app.use(
  cors({
    origin: "http://localhost:5173", // Origem do frontend
    methods: ["GET", "POST"],       // Métodos permitidos
    allowedHeaders: ["Content-Type"], // Cabeçalhos permitidos
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

app.post("/webhook", async (req, res) => {
  console.log("------------------New transaction-----------------")
  try {
    const processor = new TransactionProcessorUseCase(process.env.WALLET_ADDRESS!);
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
