import express, { Request, Response } from "express";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/webhook", (req: any, res: any) => {
  try {
    const webhookData = req.body;

    // webhook validation
    if (!Array.isArray(webhookData) || !webhookData[0]) {
      console.error("Formato inválido de webhook.");
      return res.status(400).send("Webhook data format invalid.");
    }

    // detect webhook type
    const isSwap = webhookData[0].tokenTransfers?.length > 0;
    const isTransfer = webhookData[0].nativeTransfers?.length > 0;

    if (isSwap) {
      processSwap(webhookData);
    } else if (isTransfer) {
      processTransfer(webhookData);
    } else {
      console.error("Formato de webhook não identificado.");
      return res.status(400).send("Unknown webhook format.");
    }

    res.status(200).send("Webhook received and processed.");
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    res.status(500).send("Internal server error.");
  }
});

// Função para processar o JSON tipo "swap"
function processSwap(webhookData: any) {
  const tokenTransfers = webhookData[0].tokenTransfers;
  const signature = webhookData[0].signature; 

  if (tokenTransfers.length < 2) {
    console.error("Menos de dois tokens transferidos em swap.");
    return;
  }

  const tokenVendido = {
    mint: tokenTransfers[0].mint,
    amount: tokenTransfers[0].tokenAmount,
  };

  const tokenComprado = {
    mint: tokenTransfers[1].mint,
    amount: tokenTransfers[1].tokenAmount,
  };

  console.log("--- Swap Processado ---");
  console.log(
    `Token Comprado: ${tokenComprado.mint}, Quantidade: ${tokenComprado.amount}`
  );
  console.log(
    `Token Vendido: ${tokenVendido.mint}, Quantidade: ${tokenVendido.amount}`
  );
  console.log(`Signature: ${signature}`);
  console.log("-----------------------");

  // JSON for swap
  const processedData = {
    type: "swap",
    signature: signature,
    tokenTransfers: {
      tokenComprado,
      tokenVendido,
    },
  };

  // save JSON to file
  fs.writeFileSync("swap.json", JSON.stringify(processedData, null, 2));
}

// Process transfers
function processTransfer(webhookData: any) {
  const nativeTransfers = webhookData[0].nativeTransfers;
  const signature = webhookData[0].signature; 

  if (nativeTransfers.length === 0) {
    console.error("Nenhuma transferência nativa encontrada.");
    return;
  }

  const transfer = {
    amount: nativeTransfers[0].amount,
    sender: nativeTransfers[0].fromUserAccount,
    receiver: nativeTransfers[0].toUserAccount,
  };

  console.log("--- Transferência Processada ---");
  console.log(`Quantidade: ${transfer.amount}`);
  console.log(`De: ${transfer.sender}`);
  console.log(`Para: ${transfer.receiver}`);
  console.log(`Signature: ${signature}`);
  console.log("-------------------------------");

  const processedData = {
    type: "transfer",
    signature: signature,
    transfer,
  };

  fs.writeFileSync("transfer.json", JSON.stringify(processedData, null, 2));
}

export default function startServer() {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}
