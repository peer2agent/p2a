import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { INotificationProducer } from "../interface/INotificationProducer";

export class SNSNotificationProducer implements INotificationProducer {
  private snsClient: SNSClient;
  private topicArn: string;

  constructor(topicArn: string, region: string) {
    this.snsClient = new SNSClient({ region });
    this.topicArn = topicArn;
  }

  async publishNotification(messageBody: object): Promise<void> {
    const command = new PublishCommand({
      TopicArn: this.topicArn,
      Message: JSON.stringify(messageBody),
    });

    try {
      const response = await this.snsClient.send(command);
      console.log('Notification published. MessageId:', response.MessageId);
    } catch (error) {
      console.error('Error publishing SNS notification:', error);
      throw error;
    }
  }
}
