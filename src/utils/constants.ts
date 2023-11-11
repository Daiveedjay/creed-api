const CONSTANTS = {
  PORT: (process.env.PORT as string) || 5000,
  JWT_SECRET: (process.env.JWT_SECRET as string) || "jwt_secret",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  GOOGLE_API_BASE_URL: process.env.GOOGLE_API_BASE_URL as string,
  CLIENT_APP_URL: process.env.CLIENT_APP_URL as string,
};

export default CONSTANTS;
