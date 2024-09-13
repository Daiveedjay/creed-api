import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from 'nestjs-redis-fork';
import { DbService } from './db.service';
import { Socket } from 'socket.io';
import { Params } from 'src/notification/notification.gateway';

@Injectable()
export class CustomRedisService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
    private readonly dbService: DbService
  ) { }

  async setUserOnline(parsedParams: Params[] | Params, client: Socket) {
    if (Array.isArray(parsedParams) === true) {
      parsedParams.forEach(async ({ userId, domainId }) => {
        // Add the user to the room in Redis
        await this.redis.hset(`Domain:${domainId}`, userId, client.id);
      });
    } else {
      const { userId, domainId } = parsedParams
      await this.redis.hset(`Domain:${domainId}`, userId, client.id)
    }
  }

  async setUserOffline(parsedParams: Params[] | Params) {
    if (Array.isArray(parsedParams) === true) {
      parsedParams.forEach(async ({ userId, domainId }) => {
        // Remove the user from Redis
        await this.redis.hdel(`Domain:${domainId}`, userId);
      });
    } else {
      const { userId, domainId } = parsedParams
      await this.redis.hdel(`Domain:${domainId}`, userId);
    }
  }

  async getOnlineUsers(domainId: string) {
    return await this.redis.hgetall(`Domain:${domainId}`);
  }

  async isUserOnline(userId: string, domainId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.redis.hexists(`${domainId}`, userId, (err, reply) => {
        if (err) return reject(err);
        resolve(reply === 1);
      });
    });
  }
}

