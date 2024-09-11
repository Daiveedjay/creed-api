/* eslint-disable prettier/prettier */
import {  Injectable, MethodNotAllowedException } from '@nestjs/common';
import { admin } from 'src/lib/firebase';
import { NotificationData } from 'src/types';
import { Redis } from 'ioredis';
import { InjectRedis } from 'nestjs-redis-fork';
import { DbService } from './db.service';

@Injectable()
export class NotifyService {
  constructor(
    @InjectRedis() 
    private readonly redis: Redis,
    private readonly dbService: DbService
  ) {}

  // Store a device token in Redis
  public async storeDeviceToken(userId: string, token: string) {
    await this.redis.set(`user:${userId}:tokens`, token);
  }

  // Retrieve device tokens from Redis
  public async getDeviceTokens(userId: string[]) {
    const allTokens = new Set();
    for (const id of userId) {
      const tokens = await this.redis.get(`user:${id}:tokens`);
      allTokens.add(tokens);
    }

    const tokens = Array.from(allTokens) as string[];
    return tokens;
  }

  private async sendNotification(token: string, messageData: NotificationData) {
    const message: admin.messaging.Message = {
      token: token,
      notification: {
        title: messageData.title.toString(),
        body: messageData.body.toString(),
      },
      data: {
        dummy: 'Just dummy'
      }
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      // if (error.code === 'messaging/registration-token-not-registered') {
      //   this.newTokenCreation(userId)
      // }
    }
  }

  // private async newTokenCreation(userId: string) {
  //   const user = await this.dbService.user.findUnique({
  //     where: {
  //       id: userId
  //     }
  //   })

  //   if(!user) {
  //     throw new MethodNotAllowedException('Umm who are you?')
  //   };


  //   await this.dbService.device.update({
  //     where: {
  //       userId,
  //     },
  //     data: {
  //       deviceToken: token
  //     }
  //   })
  // }

  public async notifyUser(userId: string[], messageData: NotificationData) {
    const responses = new Set();
    const tokens = await this.getDeviceTokens(userId);

    for (const token of tokens) {
      const response = await this.sendNotification(token, messageData);
        // const error = response.error;
        // if (error) {
        //   console.error('Failure sending notification to', tokens[index], error);
        //   // Cleanup the tokens who are not registered anymore.
        //   if (error.code === 'messaging/invalid-registration-token' ||
        //       error.code === 'messaging/registration-token-not-registered') {
        //     tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
        //   }
        // };;
      responses.add(response);
    }

    return Array.from(responses);
  }
}
