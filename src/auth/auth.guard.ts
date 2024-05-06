/* eslint-disable prettier/prettier */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { DbService } from '../utils/db.service';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
// import { type Request } from 'express';
import { AuthRequest } from 'src/types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly dbService: DbService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  async validateRequest(req: AuthRequest) {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new ForbiddenException('Please provide auth token');
    const token: string | undefined = authHeader.split(' ').pop();
    if (!token) {
      throw new ForbiddenException('Invalid token');
    }

    try {
      const decoded = new JwtService().verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.dbService.user.findUnique({
        where: { id: decoded.uid },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          email: true,
          fullName: true,
        },
      });

      if (!user) {
        throw new NotFoundException();
      }

      req.user = user;
      return true;
    } catch (err) {
      throw new ForbiddenException('Invalid token');
    }
  }
}

export const CurrentUser = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = <AuthRequest>ctx.switchToHttp().getRequest();

    if (!!request.user) {
      return !!data ? request.user[data] : request.user;
    }

    throw new UnauthorizedException('Not allowed!');
  }
);
