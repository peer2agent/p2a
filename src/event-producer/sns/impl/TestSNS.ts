import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({ region: "us-east-2" });
const topicArn = "arn:aws:sns:us-east-2:888577041203:ProcessResult";

async function sendTestNotification() {
  const messageBody = {
    userId: "test-user",
    result: "SUCCESS",
    processedAt: new Date().toISOString(),
  };

  const command = new PublishCommand({
    TopicArn: topicArn,
    Message: JSON.stringify(messageBody),
  });

  try {
    const response = await snsClient.send(command);
    console.log("Notification sent! MessageId:", response.MessageId);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

sendTestNotification();
