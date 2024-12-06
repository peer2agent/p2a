// import fs from "fs";

// // Load webhook data from the JSON file
// try {
//     const webhookData = JSON.parse(
//         fs.readFileSync("./webhooks/webhook_data2.json", "utf8")
//     );
//     // Define wallet address
//     const walletAddress = "6Lzg4arDYUjvogN3CLYfyqAgGvwU5GzmNqMR8rshfGKu"; 
    
//     // Extract token transfers
//     const tokenTransfers = webhookData[0]?.tokenTransfers || [];
    
//     // Identify sent and received tokens
//     const sentToken = tokenTransfers.find(
//         (transfer: any) => transfer.fromUserAccount === walletAddress
//     );
    
//     const receivedToken = tokenTransfers.find(
//         (transfer: any) => transfer.toUserAccount
//     );
    
//     console.log(sentToken);
//     console.log(receivedToken);

// } catch (error) {
//     console.error("Failed to load webhook data:", error);
//     process.exit(1); 
// }


// // console.log(
// //     "Sent token: " + sentToken.mint + " | Amount: " + sentToken.tokenAmount
// // );

// // console.log(
// //     "Received token: " +
// //         receivedToken.mint +
// //         " | Amount: " +
// //         receivedToken.tokenAmount
// // );
