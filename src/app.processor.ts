import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from './utils/email.service';

@Processor('emailQueue')
export class AppProcessor {
  constructor(
    private readonly emailService: EmailService
  ) { }

  @Process('sendEmail')
  async handleEmailJob(job: Job) {
    const { email, subject, body } = job.data;

    if (Array.isArray(email)) {
      await this.emailService.sendMultipleEmails(email, subject, body);

    } else {
      await this.emailService.sendEmail(email, subject, body);
    }
  }
}

