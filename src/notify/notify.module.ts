/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { NotifyGateway } from './notify.gateway';
import { GatewaySessionManager } from './notify-sessions';

@Module({
  providers: [
    NotifyGateway,
    GatewaySessionManager
  ],
  exports: [
    NotifyGateway,
    GatewaySessionManager
  ],
})
export class NotifyModule {}
