export interface INotificationProducer {
  publishNotification(messageBody: object): Promise<void>;
}
