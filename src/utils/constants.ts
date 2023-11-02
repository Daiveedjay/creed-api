
const CONSTANTS = {
  PORT: process.env.PORT as string || 5000,
  JWT_SECRET: process.env.JWT_SECRET as string || "jwt_secret",

}

export default CONSTANTS;