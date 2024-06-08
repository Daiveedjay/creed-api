/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { AuthenticatedSocket } from '../types';

export interface IGatewaySessionManager {
  getUserSocket(id: string): AuthenticatedSocket;
  setUserSocket(id: string, socket: AuthenticatedSocket): void;
  removeUserSocket(id: string): void;
  getSockets(): Map<number, AuthenticatedSocket>;
}

@Injectable()
export class GatewaySessionManager implements IGatewaySessionManager {
  private readonly sessions: Map<number, AuthenticatedSocket> = new Map();

  getUserSocket(id: string) {
    return this.sessions.get(Number(id)) as AuthenticatedSocket;
  }

  setUserSocket(userId: string, socket: AuthenticatedSocket) {
    this.sessions.set(Number(userId), socket);
  }
  removeUserSocket(userId: string) {
    this.sessions.delete(Number(userId));
  }
  getSockets(): Map<number, AuthenticatedSocket> {
    return this.sessions;
  }
}
