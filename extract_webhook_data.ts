import fs from "fs";

// Load webhook data from the JSON file
const webhookData = JSON.parse(
    fs.readFileSync("./webhooks/webhook_data2.json", "utf8")
);

// Define your wallet address
const walletAddress = "FgAhgj6RoVikRvPxaxTo42vLf4AmHDj2xWGEnfSZn6tY"; // Replace with your actual wallet address

// Extract token transfers
const tokenTransfers = webhookData[0]?.tokenTransfers || [];

// Identify sent and received tokens
const sentToken = tokenTransfers.find(
    (transfer: any) => transfer.fromUserAccount === walletAddress
);

const receivedToken = tokenTransfers.find(
    (transfer: any) => transfer.toUserAccount === walletAddress
);

console.log(sentToken);

console.log(receivedToken);

// console.log(
//     "Sent token: " + sentToken.mint + " | Amount: " + sentToken.tokenAmount
// );

// console.log(
//     "Received token: " +
//         receivedToken.mint +
//         " | Amount: " +
//         receivedToken.tokenAmount
// );
