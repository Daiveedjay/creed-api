import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { DbService } from '../utils/db.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly dbService: DbService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  async validateRequest(req: any) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ').pop();
    if (!token) {
      throw new ForbiddenException('Invalid token');
    }

    try {
      const decoded = new JwtService().verify(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.dbService.user.findUnique({
        where: { id: decoded.sub },
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
      console.log(err);
      throw new ForbiddenException('Invalid token');
    }
  }
}
