// import express from "express";
// import bodyParser from "body-parser";
// import fs from "fs";
// import path from "path";

// export class WebhookServer {
//   private readonly port: number;

//   constructor(port: number) {
//     this.port = port;
//   }

//   startServer(): void {
//     const app = express();
//     app.use(bodyParser.json());

//     app.post("/webhook", (req, res) => {
//       console.log(`[${new Date().toISOString()}] Webhook received.`);

//       // Processar o webhook recebido
//       const extractedData = this.processWebhook(req.body);

//       if (extractedData) {
//         this.saveWebhookData(extractedData);
//       } else {
//         console.log(
//           `[${new Date().toISOString()}] No relevant data found in webhook.`
//         );
//       }

//       res.status(200).send("Webhook processed.");
//     });

//     app.listen(this.port, () => {
//       console.log(
//         `[${new Date().toISOString()}] Webhook server running at http://localhost:${
//           this.port
//         }/webhook`
//       );
//     });
//   }

//   private processWebhook(data: any): any {
//     console.log(`[${new Date().toISOString()}] Processing webhook data...`);

//     const tokenTransfers = data.tokenTransfers || [];
//     if (tokenTransfers.length === 0) {
//       console.log(`[${new Date().toISOString()}] No token transfers found.`);
//       return null;
//     }

//     // Encontrar transferências de entrada e saída
//     const soldToken = tokenTransfers.find(
//       (transfer: any) => transfer.fromUserAccount
//     );
//     const boughtToken = tokenTransfers.find(
//       (transfer: any) => transfer.toUserAccount
//     );

//     if (!soldToken || !boughtToken) {
//       console.log(
//         `[${new Date().toISOString()}] Could not find both sold and bought tokens.`
//       );
//       return null;
//     }

//     // Montar os dados relevantes
//     const extractedData = {
//       soldToken: soldToken.mint,
//       soldAmount: soldToken.tokenAmount,
//       boughtToken: boughtToken.mint,
//       boughtAmount: boughtToken.tokenAmount,
//       portfolioPercentage: this.calculatePortfolioPercentage(
//         soldToken.tokenAmount,
//         boughtToken.tokenAmount
//       ), 
//       wallet: soldToken.fromUserAccount,
//     };

//     console.log(`[${new Date().toISOString()}] Extracted Data:`, extractedData);
//     return extractedData;
//   }

//   private calculatePortfolioPercentage(
//     soldAmount: number,
//     boughtAmount: number
//   ): number {
//     const totalAmount = Math.abs(soldAmount) + Math.abs(boughtAmount);
//     const percentage = (Math.abs(boughtAmount) / totalAmount) * 100;
//     return parseFloat(percentage.toFixed(2));
//   }

//   private saveWebhookData(data: any): void {
//     try {
//       const outputDir = path.join(__dirname, "webhooks");
//       const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
//       const filePath = path.join(outputDir, `webhook_${timestamp}.json`);

//       if (!fs.existsSync(outputDir)) {
//         fs.mkdirSync(outputDir);
//         console.log(
//           `[${new Date().toISOString()}] Created directory for webhooks.`
//         );
//       }

//       fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
//       console.log(
//         `[${new Date().toISOString()}] Webhook data saved to ${filePath}`
//       );
//     } catch (error) {
//       console.error(
//         `[${new Date().toISOString()}] Error saving webhook data:`,
//         error
//       );
//     }
//   }
// }
