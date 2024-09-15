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
  NotificationAssignedTasks,
  NotificationTasks
} from './notification.types';
import { CustomRedisService } from 'src/utils/redis.service';
import { DbService } from 'src/utils/db.service';

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
  constructor(
    private readonly redisService: CustomRedisService,
    private readonly dbService: DbService
  ) { }

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

  //For all users in a domain
  @SubscribeMessage('send-announcement')
  async sendAnnouncement(@MessageBody() payload: INotification) {
    try {
      // Get all users from the Redis room
      const usersInRoom = await this.redisService.getOnlineUsers(payload.domain);

      // Send the message to each user in the room
      Object.values(usersInRoom).forEach(socketId => {
        //console.log({ socketId })
        this.server.to(socketId).emit('announcement', payload.message);
      });

    } catch (error) {
      this.logger.error('Couldnt not send announcement: ', error)
    }
  }

  //For all users in a particular panel
  @SubscribeMessage('send-info')
  async sendAnnouncementToOnlineUsers(@MessageBody() payload: NotificationTasks) {
    try {
      // Get all users from the Redis room
      const usersInRoom = await this.redisService.getOnlineUsers(payload.domain);
      const allOnlineUsersIds = Object.keys(usersInRoom)
      const panelMembers = await this.dbService.panel.findFirst({
        where: {
          id: payload.panel,
          domainId: payload.domain,
        },
        select: {
          panelMembers: {
            select: {
              userId: true
            }
          }
        }
      })
      const panelMemberIds = panelMembers.panelMembers.map((member) => member.userId);

      // Filter online users who are also panel members
      const onlinePanelMembers = allOnlineUsersIds.filter((onlineId) =>
        panelMemberIds.includes(onlineId)
      );

      const onlinePanelMembersSocketIds = await this.redisService.getSocketIds(onlinePanelMembers, payload.domain)
      console.log(onlinePanelMembersSocketIds)

      // Send the message to each user in the room
      onlinePanelMembersSocketIds.map((socketId: string) => {
        //console.log({ socketId })
        this.server.to(socketId).emit('info', payload.message);
      });

    } catch (error) {
      this.logger.error('Couldnt not send announcement: ', error)
    }
  }

  //For people that have been assigned tasks to and mentioned in an announcement
  @SubscribeMessage('send-to-assigned')
  async sendAnnouncementToAssignedUsers(@MessageBody() payload: NotificationAssignedTasks) {
    try {
      // Get all users from the Redis room
      const usersInRoom = await this.redisService.getOnlineUsers(payload.domain);
      const allOnlineUsersIds = Object.keys(usersInRoom)
      //
      // Filter online users who are also panel members
      const onlinePanelMembers = allOnlineUsersIds.filter((onlineId) =>
        payload.assignedUsers.includes(onlineId)
      );

      const onlinePanelMembersSocketIds = await this.redisService.getSocketIds(onlinePanelMembers, payload.domain)
      console.log(onlinePanelMembersSocketIds)

      // Send the message to each user in the room
      onlinePanelMembersSocketIds.map((socketId: string) => {
        //console.log({ socketId })
        this.server.to(socketId).emit('to-assigned', payload.message);
      });

    } catch (error) {
      this.logger.error('Couldnt not send announcement: ', error)
    }
  }

}
