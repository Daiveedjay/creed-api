import { Logger } from "@nestjs/common";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { INotification, INotificationAction, NotificationEvents } from "./notification.types";

@WebSocketGateway({
    namespace: "/notification",
    cors: {
        origin: "*"
    }
})
export class NotificationGateway {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger("NotificationGateway");

    afterInit() {
        this.logger.log("Sockets initialized");
    }

    @SubscribeMessage(NotificationEvents.JOIN_ROOM)
    joinDomain(client: Socket, room: string): void {
        client.join(room);
    }

    @SubscribeMessage(NotificationEvents.LEAVE_ROOM)
    leaveDomain(client: Socket, room: string): void {
        client.leave(room);
    }

    @SubscribeMessage(NotificationEvents.JOIN_DOMAIN)
    sendNotification(message: string): void {
        this.server.emit('message', message);
    }

    // actions
    sendAction(message: INotificationAction): void {
        this.server.to(message.domain).emit(message.action, message.message);
    }
}
