/* eslint-disable prettier/prettier */
import { InternalServerErrorException, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SESClient, SendEmailCommand, SendEmailRequest } from '@aws-sdk/client-ses';
import {createTransport, Transporter} from 'nodemailer'
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
    private sesClient: SESClient;
    private transporter: Transporter

    constructor() {
        this.sesClient = new SESClient({
            region: process.env.SMTP_REGION,
            credentials: {
                accessKeyId: process.env.SMTP_ACCESSKEYID,
                secretAccessKey: process.env.SMTP_SECRETACCESSKEY,
            },
        })

        this.transporter = createTransport({
            host: process.env.SMTP_ENDPOINT!,
            port: process.env.SMTP_PORT as unknown as number,
            secure: false,
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        })
    }

    // async sendWelcomeEmail(address: string, name: string): Promise<void> {
    //     // const hell = new SES({})

    //     // hell.sendEmail({})
    //     const params: SendEmailRequest = {
    //         Destination: {
    //             ToAddresses: [address]
    //         },
    //         // Template: 'WelcomeNewUser', // Replace with your template name
    //         // TemplateData: JSON.stringify({
    //         //     userName: name,
    //         // }),
    //         Message: {
    //             Body: {
    //                 Html: {
    //                     Charset: 'UTF-8',
    //                     Data: `<head></head><body><h1>Welcome to Kreed!</h1><p>Welcome ${name},</p><p>Welcome to Kreed – where collaboration meets productivity! We’re thrilled to have you join our community.</p><h2>What is Kreed?</h2><p>Kreed combines the best features of task management and team communication into one seamless platform. Imagine having the power of Asana and Slack at your fingertips, all in one place.</p><h3>Key Features:</h3><ul><li><strong>Task Management:</strong> Organize, prioritize, and track tasks and projects effortlessly.</li><li><strong>Team Communication:</strong> Chat, share files, and conduct video calls within channels and direct messages.</li><li><strong>Integrations:</strong> Connect with your favorite tools like Google Drive and Trello.</li><li><strong>Customization:</strong> Design custom workflows and control user permissions.</li><li><strong>Analytics:</strong> Generate reports and insights to optimize team performance.</li></ul><p>With Kreed, you can streamline your workflow, enhance team collaboration, and boost productivity like never before.</p><p><a href="">Click here</a> to get started and explore the platform.</p><p>Best regards,<br>The Kreed Team</p><p>P.S. If you have any questions, our support team is here to help!</p></body>`
    //                 }
    //             },
    //             Subject: {
    //                 Charset: 'UTF-8',
    //                 Data: 'Welcome to Kreed'
    //             }
    //         },
    //         Source: 'jajadavidjid@gmail.com',
    //     }

    //     const command = new SendEmailCommand(params)

    //     try {
    //         const response = await this.sesClient.send(command)
    //         console.log(response.$metadata.httpStatusCode)
    //     } catch (error) {
    //         console.log(error)
    //         throw new InternalServerErrorException('Error sending emails')
    //     }
    // }

    async sendWelcomeEmail(receiverEmail: string, name: string): Promise<string> {
        const mailOptions: Mail.Options = {
            from: 'jajadavidjid@gmail.com',
            to: receiverEmail,
            subject: 'Welcome bro',
            html: `<head></head><body><h1>Welcome to Kreed!</h1><p>Welcome ${name},</p><p>Welcome to Kreed – where collaboration meets productivity! We’re thrilled to have you join our community.</p><h2>What is Kreed?</h2><p>Kreed combines the best features of task management and team communication into one seamless platform. Imagine having the power of Asana and Slack at your fingertips, all in one place.</p><h3>Key Features:</h3><ul><li><strong>Task Management:</strong> Organize, prioritize, and track tasks and projects effortlessly.</li><li><strong>Team Communication:</strong> Chat, share files, and conduct video calls within channels and direct messages.</li><li><strong>Integrations:</strong> Connect with your favorite tools like Google Drive and Trello.</li><li><strong>Customization:</strong> Design custom workflows and control user permissions.</li><li><strong>Analytics:</strong> Generate reports and insights to optimize team performance.</li></ul><p>With Kreed, you can streamline your workflow, enhance team collaboration, and boost productivity like never before.</p><p><a href="">Click here</a> to get started and explore the platform.</p><p>Best regards,<br>The Kreed Team</p><p>P.S. If you have any questions, our support team is here to help!</p></body>`
        }

        try {
            const mail = await this.transporter.sendMail(mailOptions)
            console.log(mail)
            return 'Email sent'
        } catch (error) {
            console.log(error)
            throw new InternalServerErrorException('Error')
        }
    }
}
