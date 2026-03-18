import notifier from 'node-notifier';

export function sendNotification(title: string, message: string): void {
  notifier.notify({ title, message, sound: true });
}
