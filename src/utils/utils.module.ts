/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { EmailService } from './email.service';
import { NotifyService } from './notify.service';
import { AWSService } from './aws.service';

@Global()
@Module({
  providers: [DbService, EmailService, NotifyService, AWSService],
  exports: [DbService, EmailService, NotifyService, AWSService]
})
export class UtilsModule { }
