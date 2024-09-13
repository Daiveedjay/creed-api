/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { EmailService } from './email.service';
import { NotifyService } from './notify.service';
import { AWSService } from './aws.service';
import { CustomRedisService } from './redis.service';

@Global()
@Module({
  providers: [DbService, EmailService, NotifyService, AWSService, CustomRedisService],
  exports: [DbService, EmailService, NotifyService, AWSService, CustomRedisService]
})
export class UtilsModule { }
