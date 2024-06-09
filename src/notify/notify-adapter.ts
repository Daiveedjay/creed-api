/* eslint-disable prettier/prettier */
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AuthenticatedSocket } from '../types';
import { DbService } from '../utils/db.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';

export class WebsocketAdapter extends IoAdapter {
    createIOServer(port: number, options?: any) {
        const server = super.createIOServer(port, options);
        server.use(async (socket: AuthenticatedSocket, next) => {
        console.log('Inside Websocket Adapter');
        const clientCookies = socket.handshake.auth.token;
        if (!clientCookies) {
            console.log('Client has no cookies');
            return next(new Error('Not Authenticated. No cookies were sent'));
        }

        const decodedCookie = new JwtService().verify(clientCookies[1], {
            secret: process.env.JWT_SECRET as string,
        });
        if (!decodedCookie) {
            console.log('CHAT_APP_SESSION_ID DOES NOT EXIST');
            return next(new Error('Not Authenticated'));
        }

        const user = await new DbService().user.findUnique({
            where: { id: decodedCookie.uid },
            select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            email: true,
            fullName: true,
            },
        });

        if (!user) {
            return next(new NotFoundException());
        }

        socket.user = user;
        next();
        });
        return server;
    }
}
