/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [DbService, EmailService],
  exports: [DbService, EmailService]
})
export class UtilsModule { }
