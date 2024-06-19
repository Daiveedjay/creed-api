import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  INotification,
  INotificationAction,
  NotificationEvents,
} from './notification.types';

@WebSocketGateway({
  namespace: '/notification',
  cors: {
    origin: '*',
  },
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationGateway');

  afterInit() {
    this.logger.log('Sockets initialized');
  }

  @SubscribeMessage(NotificationEvents.JOIN_DOMAIN)
  joinDomain(client: Socket, domainId: string): void {
    client.join(domainId);
    client.emit('joinedDomain', domainId);
  }

  @SubscribeMessage(NotificationEvents.LEAVE_DOMAIN)
  leaveDomain(client: Socket, domainId: string): void {
    client.leave(domainId);
    client.emit('leftDomain', domainId);
  }

  sendNotification(payload: INotification): void {
    this.server.to(payload.domain).emit('message', payload.message);
  }

  // actions
  sendAction(message: INotificationAction): void {
    this.server.to(message.domain).emit(message.action, message.message);
  }
}
