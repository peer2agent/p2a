import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Endpoint do webhook
app.post("/webhook", (req, res) => {
  try {
    const data = req.body;
    const filePath = path.join(__dirname, "webhook.json");
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(
      `[${new Date().toISOString()}] Dados recebidos e salvos no webhook.json`
    );
    res.status(200).json({ message: "Dados recebidos e salvos com sucesso!" });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Erro ao processar o webhook:`,
      error
    );
    res.status(500).json({ message: "Erro ao processar o webhook" });
  }
});

export function startServer() {
  app.listen(PORT, () => {
    console.log(`Servidor escutando na porta ${PORT}`);
  });
}
