import { ConflictException, Injectable } from "@nestjs/common";
import { admin } from "src/lib/firebase";
import { NotificationData } from "src/types";
import { Redis } from "ioredis";
import { InjectRedis } from "nestjs-redis-fork";


@Injectable()
export class NotifyService {
  constructor(
    @InjectRedis() private readonly redis: Redis
  ) { }

  // Store a device token in Redis
  public async storeDeviceToken(userId: string, token: string) {
    await this.redis.set(`user:${userId}:tokens`, token);
  };

  // Retrieve device tokens from Redis
  public async getDeviceTokens(userId: string[]) {
    const allTokens = new Set()
    for (const id of userId) {
      const tokens = await this.redis.get(`user:${id}:tokens`);
      allTokens.add(tokens)
    }

    const tokens = Array.from(allTokens) as string[]
    if (tokens.length < 0) {
      throw new ConflictException('These users are not in this platform?')
    }

    return tokens;
  };

  private async sendNotification(tokens: string[], messageData: NotificationData) {
    const message: admin.messaging.MulticastMessage = {
      tokens: tokens,
      notification: {
        title: messageData.title,
        body: messageData.body,
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  public async notifyUser(userId: string[], messageData: NotificationData) {
    const tokens = await this.getDeviceTokens(userId)

    await this.sendNotification(tokens, messageData)
  };
}
