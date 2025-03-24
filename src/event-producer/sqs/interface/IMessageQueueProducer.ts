export interface IMessageQueueProducer {
  sendMessage(messageBody: object): Promise<void>;
}
