// task.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { QueueJob } from 'src/types';
import { EmailService } from 'src/utils/email.service';

@Processor('emailQueue')
export class TaskProcessor {
  private readonly logger: Logger

  constructor(
    private readonly emailService: EmailService
  ) { }

  @Process('sendEmail')
  async handleEmailJob(job: QueueJob) {
    const { email, subject, body } = job;

    if (Array.isArray(email)) {
      await this.emailService.sendMultipleEmails(email, subject, body);

    } else {
      await this.emailService.sendEmail(email, subject, body);
    }

    this.logger.log('Email sent through queue jobs')
  }
}
