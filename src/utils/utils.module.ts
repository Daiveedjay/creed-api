/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { EmailService } from './email.service';
import { AWSService } from './aws.service';
import { CustomRedisService } from './redis.service';
import { TimeService } from './time.service';

@Global()
@Module({
  providers: [DbService, EmailService, AWSService, CustomRedisService, TimeService],
  exports: [DbService, EmailService, AWSService, CustomRedisService, TimeService]
})
export class UtilsModule { }
