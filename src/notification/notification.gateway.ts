import { Logger, PayloadTooLargeException } from '@nestjs/common';
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
  NotificationCreatedPanels,
  NotificationPanelModify,
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

  async globalWebSocketFunction(payload: INotification, emitString: string) {
    try {
      // Get all users from the Redis room
      const usersInRoom = await this.redisService.getOnlineUsers(payload.domain);

      // Send the message to each user in the room
      Object.values(usersInRoom).forEach(socketId => {
        //console.log({ socketId })
        this.server.to(socketId).emit(emitString, payload.message);
      });

    } catch (error) {
      this.logger.error(`Couldnt send to ${emitString}: `, error)
    }

  }

  //For all users in a domain
  @SubscribeMessage('send-gen-announcement')
  async sendAnnouncement(@MessageBody() payload: INotification) {
    await this.globalWebSocketFunction(payload, 'gen-announcement')
  }

  @SubscribeMessage('send-column-announcement')
  async sendColumnAnnouncement(@MessageBody() payload: INotification) {
    await this.globalWebSocketFunction(payload, 'column-announcement')
  }

  @SubscribeMessage('send-panel-announcement')
  async sendPaneAnnouncement(@MessageBody() payload: INotification) {
    await this.globalWebSocketFunction(payload, 'panel-announcement')
  }

  @SubscribeMessage('send-collab-announcement')
  async sendCollaboratorsAnnouncement(@MessageBody() payload: INotification) {
    await this.globalWebSocketFunction(payload, 'collab-announcement')
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

      console.log(onlinePanelMembers)
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

  @SubscribeMessage('send-to-mentioned')
  async sendTaggedAnnouncements(@MessageBody() payload: NotificationAssignedTasks) {
    try {
      // Get all users from the Redis room
      const usersInRoom = await this.redisService.getOnlineUsers(payload.domain);
      const allOnlineUsersIds = Object.keys(usersInRoom)
      //
      // Filter online users who are also panel members
      const onlinePanelMembers = allOnlineUsersIds.filter((onlineId) =>
        payload.assignedUsers.includes(onlineId)
      );

      console.log(onlinePanelMembers)
      const onlinePanelMembersSocketIds = await this.redisService.getSocketIds(onlinePanelMembers, payload.domain)
      console.log(onlinePanelMembersSocketIds)

      // Send the message to each user in the room
      onlinePanelMembersSocketIds.map((socketId: string) => {
        //console.log({ socketId })
        this.server.to(socketId).emit('to-mentioned', payload.message);
      });

    } catch (error) {
      this.logger.error('Couldnt not send announcement: ', error)
    }
  }

  @SubscribeMessage('panel-modify-announcement')
  async sendToUpdatesPanelAnnouncement(@MessageBody() payload: NotificationPanelModify) {
    try {
      // Get all users from the Redis room
      const usersInRoom = await this.redisService.getOnlineUsers(payload.domain);
      const allOnlineUsersIds = Object.keys(usersInRoom)
      const particularPanel = await this.dbService.panel.findUnique({
        where: {
          id: payload.panel,
          domainId: payload.domain
        }
      })

      const particularDomain = await this.dbService.domain.findUnique({
        where: {
          id: payload.domain
        },
      })
      // Filter online users who are also panel members
      const onlinePanelMembers = allOnlineUsersIds.filter((onlineId) =>
        payload.users.includes(onlineId)
      );

      const onlinePanelMembersSocketIds = await this.redisService.getSocketIds(onlinePanelMembers, payload.domain)

      // Send the message to each user in the room
      onlinePanelMembersSocketIds.map((socketId: string) => {
        //console.log({ socketId })
        this.server.to(socketId).emit('modify-announcement', `You have been ${payload.message} from panel: ${particularPanel.name} in domain: ${particularDomain.name}`);
      });

    } catch (error) {
      this.logger.error('Couldnt not send announcement: ', error)
    }
  }

  @SubscribeMessage('send-created-panel')
  async sendCreatedPanelNotifications(@MessageBody() payload: NotificationCreatedPanels) {
    try {
      // Get all users from the Redis room
      const usersInRoom = await this.redisService.getOnlineUsers(payload.domain);
      const allOnlineUsersIds = Object.keys(usersInRoom)
      const particularDomain = await this.dbService.domain.findUnique({
        where: {
          id: payload.domain
        },
        select: {
          ownerId: true,
          domainMembers: {
            select: {
              userId: true,
              memberRole: true
            }
          }
        }
      })

      const author = await this.dbService.user.findUnique({
        where: {
          id: payload.authorId
        },
        select: {
          fullName: true,
          username: true
        }
      })
      const everyoneNeededToSend = [particularDomain.ownerId]
      // Filter online users who are also panel members
      const onlinePanelMembers = allOnlineUsersIds.filter((onlineId) =>
        everyoneNeededToSend.includes(onlineId)
      );

      const onlinePanelMembersSocketIds = await this.redisService.getSocketIds(onlinePanelMembers, payload.domain)

      // Send the message to each user in the room
      onlinePanelMembersSocketIds.map((socketId: string) => {
        //console.log({ socketId })
        this.server.to(socketId).emit('created-panel', `${author.fullName} has created a new panel: ${payload.message}`);
      });

    } catch (error) {
      this.logger.error('Couldnt not send announcement: ', error)
    }

  }
}
