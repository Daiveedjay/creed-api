import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { HttpException, Injectable } from '@nestjs/common';
import { HttpStatusCode } from 'axios';
import { Transporter, createTransport } from "nodemailer"
import { MailOptions } from 'nodemailer/lib/json-transport';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "7c85c5001@smtp-brevo.com",
        pass: "0CgBn7ERL3Q4U1c6",
      },
    });
  }

  async sendWelcomeEmail(to: string, name: string) {
    const params: MailOptions = {
      from: 'kreednotifications@gmail.com', // Verified SES email
      to: to,
      subject: 'Welcome to Kreed!',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
        }
        .header img {
            width: 100%;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #007bff;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <p>Hi ${name},</p>

        <p>
            Welcome to <strong>Kreed</strong>! We're excited to have you on board.
            Your account has been successfully created, and you’re all set to start
            managing tasks, collaborating with your team, and making the most out of our platform.
            At Kreed, we're here to help you streamline your work and boost productivity.
        </p>

        <p>Here’s what you can do next:</p>

        <ul>
            <li><strong>Explore tasks and domains:</strong> Start managing your tasks with our powerful task manager.</li>
            <li><strong>Collaborate effortlessly:</strong> Add team members and assign tasks to keep everyone aligned.</li>
            <li><strong>Stay productive:</strong> Use our tools to track progress and meet your goals.</li>
        </ul>

        <p>
            Should you need any help, feel free to check out our 
            <a href="mailto:kreednotifications@gmail.com" target="_blank">Help Center</a> or contact our support team anytime.
        </p>

        <p>We're always here to assist you.</p>

        <p>Once again, thank you for choosing Kreed—we’re thrilled to have you!</p>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
<p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.
            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>
        </div>
    </div>
</body>
</html>
`,
    };

    try {
      // const command = new SendEmailCommand(params);
      // const response = await this.sesClient.send(command);
      const response = await this.transporter.sendMail(params)
      console.log(response)
      return new HttpException('Email sent!', HttpStatusCode.Created)
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async sendEmail(to: string, subject: string, body: string) {
    const params: MailOptions = {
      from: 'kreednotifications@gmail.com', // Verified SES email
      to: to,
      subject,
      html: body,
    };

    try {
      // const command = new SendEmailCommand(params);
      const response = await this.transporter.sendMail(params);
      console.log(response)
      return new HttpException('Email sent!', HttpStatusCode.Created)
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async sendMultipleEmails(toes: string[], subject: string, body: string) {
    for (const to of toes) {
      await this.sendEmail(to, subject, body)
    }
  }
}

