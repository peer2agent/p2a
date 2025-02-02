import cors from "cors";
import express from "express";
import { TrackingWalletUseCase } from "../../usecase/impl/TrackingWalletUseCase";
import fs from "fs";
import dotenv from "dotenv";
import { TraderBotUseCase } from "../../usecase/impl/TraderBotUseCase";
import { RealiseSwap } from "../../usecase/impl/RealiseSwapUseCase";
import { TrackingInfoInputDTO } from "../../input/dto/TrackingInfoInputDTO";

dotenv.config();

// Extend the window interface to include solana
interface SolanaWindow extends Window {
  solana?: any;
}



declare const window: SolanaWindow;

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


app.post("/webhook", (req: any, res: any) => {
  try {
    const webhookData = req.body;

    // Validação básica
    if (!Array.isArray(webhookData) || !webhookData[0]) {
      console.error("Formato inválido de webhook.");
      return res.status(400).send("Webhook data format invalid.");
    }

    const type = webhookData[0].type?.toUpperCase();

    switch (type) {
      case "SWAP":
        processSwap(webhookData);
        break;
      case "TRANSFER":
        processTransfer(webhookData);
        break;
      case "UNKNOWN":
        processUnknown(webhookData);
        break;
      default:
        console.error("Tipo de webhook não identificado.");
        return res.status(400).send("Unknown webhook type.");
    }

    res.status(200).send("Webhook received and processed.");
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    res.status(500).send("Internal server error.");
  }
});

// Função para processar "swap"
function processSwap(webhookData: any) {
  const tokenTransfers = webhookData[0].tokenTransfers || [];
  const signature = webhookData[0].signature;

  console.log("--- SWAP ---");
  tokenTransfers.forEach((transfer: any, index: number) => {
    if (transfer.fromUserAccount === process.env.WALLET_ADDRESS) {
      console.log("SELL: ");
    }
    if (transfer.toUserAccount === process.env.WALLET_ADDRESS) {
      console.log(`[${formatTimestamp()}] BUY: `);
    }
    console.log(`- Token Address: ${transfer.mint}`);
    console.log(`- Token Amount: ${transfer.tokenAmount}`);
    console.log(`- From: ${transfer.fromUserAccount}`);
    console.log(`- To: ${transfer.toUserAccount}`);
    console.log(
      `- BullX Link: https://bullx.io/terminal?chainId=1399811149&address=${transfer.mint}`
    );
  });
  console.log(`Signature: ${signature}`);
  console.log("------------------------");

  const processedData = {
    type: "swap",
    signature: signature,
    tokenTransfers,
  };

  fs.writeFileSync("swap.json", JSON.stringify(processedData, null, 2));
}

// Função para processar "transfer"
function processTransfer(webhookData: any) {
  const tokenTransfers = webhookData[0].tokenTransfers || [];
  const signature = webhookData[0].signature;

  console.log("--- TRANSFER ---");
  tokenTransfers.forEach((transfer: any, index: number) => {
    if (transfer.fromUserAccount === process.env.WALLET_ADDRESS) {
      console.log("SEND: ");
    }
    if (transfer.toUserAccount === process.env.WALLET_ADDRESS) {
      console.log("RECEIVE: ");
    }
    // console.log(`Transferência ${index + 1}:`);
    console.log(`- Amount: ${transfer.amount}`);
    console.log(`- Token Address: ${transfer.mint}`);
    console.log(
      `- Solscan link to transaction: https://solscan.io/tx/${signature}`
    );
  });
  console.log(`Transfer Signature: ${signature}`);
  console.log("-------------------------------");

  // Salvar JSON formatado
  const processedData = {
    type: "transfer",
    signature: signature,
    tokenTransfers,
  };

  fs.writeFileSync("transfer.json", JSON.stringify(processedData, null, 2));
}

// Função para processar "unknown"
function processUnknown(webhookData: any) {
  const tokenTransfers = webhookData[0].tokenTransfers || [];
  // const nativeTransfers = webhookData[0].nativeTransfers || [];
  const signature = webhookData[0].signature;

  console.log("--- UNKNOWN ---");
  if (tokenTransfers.length > 0) {
    console.log("Token Transfers:");
    tokenTransfers.forEach((transfer: any, index: number) => {
      console.log(`Transferência ${index + 1}:`);
      console.log(`- Mint: ${transfer.mint}`);
      console.log(`- Token Amount: ${transfer.tokenAmount}`);
      console.log(`- From: ${transfer.fromUserAccount}`);
      console.log(`- To: ${transfer.toUserAccount}`);
    });
  }
  console.log(`Signature: ${signature}`);
  console.log("---------------------------");

  // Salvar JSON formatado
  const processedData = {
    type: "unknown",
    signature: signature,
    tokenTransfers,
  };

  fs.writeFileSync("unknown.json", JSON.stringify(processedData, null, 2));
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

const port = 3000; // Defina a porta que deseja usar
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
