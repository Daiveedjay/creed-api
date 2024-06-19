export interface INotification {
  domain: string; // in sockets.io terms rooms
  message: string;
}

export interface INotificationAction {
  domain: string; // in sockets.io terms rooms
  message: string;
  action: NotificationEvents;
}

export enum NotificationEvents {
  GENERAL = 'GENERAL',

  // Notify the users
  NOTIFY = 'NOTIFY',

  // Room - being the domain ID, for the idea of changing domain on ui i.e joining/leaving a socket room
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',

  // Domain - being the domain ID, for the idea of joining/leaving the domain as a member
  JOIN_DOMAIN = 'JOIN_DOMAIN',
  LEAVE_DOMAIN = 'LEAVE_DOMAIN',

  // Panel
  CREATE_PANEL = 'CREATE_PANEL',
  EDIT_PANEL = 'EDIT_PANEL',
  DELETE_PANEL = 'DELETE_PANEL',

  // Task
  CREATE_TASK = 'CREATE_TASK',
  EDIT_TASK = 'EDIT_TASK',
  DELETE_TASK = 'DELETE_TASK',
}
