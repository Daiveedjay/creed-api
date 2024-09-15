export interface INotification {
  domain: string; // in sockets.io terms rooms
  message: string;
}

export interface NotificationTasks {
  domain: string;
  panel: string;
  message: string
}

export interface NotificationAssignedTasks {
  domain: string;
  message: string;
  assignedUsers: string[];
}

export interface NotificationCreatedPanels {
  domain: string;
  authorId: string;
  message: string;
}
