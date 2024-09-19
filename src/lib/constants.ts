const CONSTANTS = {
  PORT: (process.env.PORT as string) || 5000,
  JWT_SECRET: (process.env.JWT_SECRET as string) || "jwt_secret",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  GOOGLE_API_BASE_URL: process.env.GOOGLE_API_BASE_URL as string,
  CLIENT_APP_URL: process.env.CLIENT_APP_URL as string,
  REDIS_URL: (process.env.REDIS_URL as string) || 'redis://localhost:6379',
  OTP_LENGTH: 6,
  OTP_TTL: 1, // in minutes
  RATE_LIMIT_FEEDBACK: 5, // in minutes
  MAXIMUM_DOMAINS: 3,
  JOIN_DOMAIN: 'join-domain',
  LEAVE_DOMAIN: 'leave-domain',
  REMOVED_DOMAIN: 'removed-domain',
  INVITED_TO_PANEL: 'invited-to-panel',
  REMOVED_FROM_PANEL: 'removed-from-panel',
  ASSIGNED_TO_TASK: 'assigned-to-task',
  REMOVED_FROM_TASK: 'removed-from-task',
  MENTIONED_ON_CHAT: 'mentioned-on-chat',
  GETTING_PROMOTED: 'getting promoted',
  GETTING_DEMOTED: 'getting-demoted',
};

export default CONSTANTS;
