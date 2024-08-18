/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { EmailService } from './email.service';
import { NotifyService } from './notify.service';

@Global()
@Module({
  providers: [DbService, EmailService, NotifyService],
  exports: [DbService, EmailService, NotifyService]
})
export class UtilsModule { }
