import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { HttpException, Injectable } from '@nestjs/common';
import { HttpStatusCode } from 'axios';

@Injectable()
export class EmailService {
  private sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: 'us-east-1', // Specify your AWS region
      credentials: {
        accessKeyId: process.env.SMTP_USERNAME as string,
        secretAccessKey: process.env.SMTP_PASSWORD as string,
      },
    });
  }

  async sendWelcomeEmail(to: string) {
    const params: SendEmailCommandInput = {
      Source: 'jajadavidjid@gmail.com', // Verified SES email
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: 'Welcome to Kreed!',
        },
        Body: {
          Text: {
            Data: 'How are you doing young blud?. Here to be manage your company?. Yeah i see you. Pusssyy!',
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);
      console.log('Email sent successfully:', response);
      return new HttpException('Email sent!', HttpStatusCode.Created)
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async sendEmail(to: string, subject: string, body: string) {
    const params = {
      Source: 'your-email@example.com', // Verified SES email
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Text: {
            Data: body,
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);
      console.log('Email sent successfully:', response);
      return new HttpException('Email sent!', HttpStatusCode.Created)
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async sendMultipleEmails(to: string[], subject: string, body: string) {
    const params = {
      Source: 'your-email@example.com', // Verified SES email
      Destination: {
        ToAddresses: to,
      },
      Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Text: {
            Data: body,
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);
      console.log('Email sent successfully:', response);
      return new HttpException('Email sent!', HttpStatusCode.Created)
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}

