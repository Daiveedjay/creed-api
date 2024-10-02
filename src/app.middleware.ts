import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { admin } from './lib/firebase';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
  ) { }
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) throw new UnauthorizedException('Please provide auth token');
      const token: string | undefined = authHeader.split(' ').pop();
      if (!token) {
        throw new UnauthorizedException('Invalid token');
      }

      const decoded = await admin.auth().verifyIdToken(token);

      if (decoded) {
        next();
      } else {
        throw new UnauthorizedException('Unauthorized access. No token provided.');
      }

    } catch (err) {
      if (err instanceof TokenExpiredError) throw new UnauthorizedException('Token expired. Please log in again.');
      if (err) {
        throw new UnauthorizedException('No access');
      }

    }
  }
}

