import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { IMessageQueueProducer } from "../interface/IMessageQueueProducer";

export class SQSMessageProducer implements IMessageQueueProducer {
  private sqsClient: SQSClient;
  private queueUrl: string;

  constructor(queueUrl: string, region: string) {
    this.sqsClient = new SQSClient({ region });
    this.queueUrl = queueUrl;
  }

  async sendMessage(messageBody: object): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(messageBody),
    });

    try {
      const response = await this.sqsClient.send(command);
      console.log('Message sent successfully. MessageId:', response.MessageId);
    } catch (error) {
      console.error('Error sending message to SQS:', error);
      throw error;
    }
  }
}
