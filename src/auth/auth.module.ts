/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DomainModule } from 'src/domain/domain.module';
import { DomainService } from 'src/domain/domain.service';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    DomainModule,
    AnalyticsModule,
    UserModule
  ],
  controllers: [AuthController],
  providers: [AuthService, DomainService, UserService]
})
export class AuthModule { }
