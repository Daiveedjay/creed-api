/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { EmailService } from './email.service';
import { AWSService } from './aws.service';
import { CustomRedisService } from './redis.service';

@Global()
@Module({
  providers: [DbService, EmailService, AWSService, CustomRedisService],
  exports: [DbService, EmailService, AWSService, CustomRedisService]
})
export class UtilsModule { }
