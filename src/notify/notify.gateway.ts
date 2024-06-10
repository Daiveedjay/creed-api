/* eslint-disable prettier/prettier */
import {
  WebSocketGateway,
  // SubscribeMessage,
  WebSocketServer,
  OnGatewayDisconnect,
  OnGatewayConnection
} from '@nestjs/websockets';
import { AuthenticatedSocket } from '../types';
import { Server } from 'socket.io';
import {GatewaySessionManager} from './notify-sessions'

@WebSocketGateway({
  cors: {
    origin: [
      "https://kreed.tech/",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175"
    ],
  }
})
export class NotifyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly sessions: GatewaySessionManager
  ) {}

  @WebSocketServer()
  server: Server;

  handleConnection(socket: AuthenticatedSocket) {
    console.log('Incoming Connection');
    this.sessions.setUserSocket(socket.user.id, socket);
    socket.emit('connected', {});
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    console.log('handleDisconnect');
    console.log(`${socket.user.email} disconnected.`);
    this.sessions.removeUserSocket(socket.user.id);
  }
  // @SubscribeMessage('notify')
  // notify() {
  //   this.server.emit('notified', 'You might wanna refresh bro!')
  // }
  
  notifyPanelCreated(domainId: string, panelData: any) {
    this.server.to(`domain_${domainId}`).emit('panelCreated', panelData);
  }

  notifyUserJoinedDomain(userId: string, domainData: any) {
    this.server.to(`user_${userId}`).emit('userJoinedDomain', domainData);
  }

  notifyTaskCreated(domainId: string, panelId: string, taskData: any) {
    this.server.to(`domain_${domainId}`).in(`panel_${panelId}`).emit('taskCreated', taskData);
  }
}
