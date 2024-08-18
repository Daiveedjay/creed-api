import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UtilsModule } from './utils/utils.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { DomainModule } from './domain/domain.module';
import { PanelModule } from './panel/panel.module';
import { StatusModule } from './status/status.module';
import { TaskModule } from './task/task.module';
import { CollaboratorsModule } from './collaborators/collaborators.module';
import { NotificationModule } from './notification/notification.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { JwtMiddleware } from './app.middleware';
import { DomainController } from './domain/domain.controller';
import { PanelController } from './panel/panel.controller';
import { NotificationsController } from './notifications/notifications.controller';
import { AnalyticsController } from './analytics/analytics.controller';
import { UserController } from './user/user.controller';
import { AnnouncementsController } from './announcements/announcements.controller';
import { TaskController } from './task/task.controller';
import { StatusController } from './status/status.controller';
import { RedisModule } from 'nestjs-redis-fork';


@Module({
  imports: [
    RedisModule.forRoot({
      config: {
        url: 'redis://redis:6379'
      }
    }),
    AuthModule,
    UtilsModule,
    UserModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DomainModule,
    PanelModule,
    StatusModule,
    TaskModule,
    CollaboratorsModule,
    NotificationModule,
    AnnouncementsModule,
    NotificationsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).exclude(
      { path: '/join-through-link', method: RequestMethod.POST }
    ).forRoutes(
      DomainController,
      PanelController,
      NotificationsController,
      AnalyticsController,
      UserController,
      AnnouncementsController,
      TaskController,
      StatusController,
      { path: 'collaborators/:domainId', method: RequestMethod.GET },
      { path: 'collaborators/create-link', method: RequestMethod.POST }
    ); // Apply to all routes or specific ones
  }
}
