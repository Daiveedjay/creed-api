import { Logger } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
import { CustomRedisService } from 'src/utils/redis.service';

export interface Params {
  userId: string;
  domainId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationGateway');
  constructor(private readonly redisService: CustomRedisService) { }

  async handleConnection(client: Socket) {
    try {
      const params = client.handshake.query.params as string; // Get user ID from the query params
      const parsedParams: Params[] | Params = JSON.parse(params);
      await this.redisService.setUserOnline(parsedParams, client)

    } catch (error) {
      this.logger.error('Error connecting: ', error)
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const params = client.handshake.query.params as string; // Get user ID from the query params
      const parsedParams: Params[] | Params = JSON.parse(params);
      await this.redisService.setUserOffline(parsedParams)
    } catch (error) {
      this.logger.error('Error disconnecting: ', error)
    }
  }

  @SubscribeMessage('send-announcement')
  async sendAnnouncement(@MessageBody() payload: INotification) {
    try {
      // Get all users from the Redis room
      const usersInRoom = await this.redisService.getOnlineUsers(payload.domain);

      // Send the message to each user in the room
      Object.values(usersInRoom).forEach(socketId => {
        console.log({ socketId })
        this.server.to(socketId).emit('announcement', payload.message);
      });

    } catch (error) {
      this.logger.error('Couldnt not send announcement: ', error)
    }
  }

  // actions
  sendAction(message: INotificationAction): void {
    this.server.to(message.domain).emit(message.action, message.message);
  }
}
