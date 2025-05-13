import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { randomUUID } from "crypto";

export interface SendMessageDTO {
    message: string;
    id: string;
}

export class SnsImpl {
  private snsConnection: any
  private topicArn = "arn:aws:sns:us-east-1:767397781567:ReceiveEventToAgent.fifo"
  private groupId: string

  constructor(uuid: string) {
      this.snsConnection= new SNSClient({
          region: process.env.REGION!!,
          credentials: {
              accessKeyId: process.env.ACCESS_KEY_ID!!,
              secretAccessKey: process.env.SECRET_ACCESS_KEY!!,
              sessionToken: process.env.SESSION_TOKEN!!
          },
      });
      
      this.groupId = uuid
  }

    async sendMessage(sendMessageDTO: SendMessageDTO): Promise<any> {
      
      var command = new PublishCommand({
        Message: sendMessageDTO.message,
        MessageDeduplicationId: sendMessageDTO.id,
        TopicArn: this.topicArn,
        MessageGroupId: this.groupId,
      })

      const response = await this.snsConnection.send(command)
      
      console.log(response);
    
      return response;
    }
}