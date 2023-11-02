import express, { Request, Response, NextFunction } from "express";
import createHttpError, { isHttpError } from "http-errors";
import morgan from "morgan";
import authRoutes from "./routes/auth.route";

const app = express();

// Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/api/auth", authRoutes);

// Error handling middlewares
app.use((_req, _res, next) => {
  next(createHttpError(404, "Endpoint not found"));
});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  let errorMessage = "An unknown error occurred.";
  let statusCode = 500;

  if (isHttpError(error)) {
    statusCode = error.status;
    errorMessage = error.message;
  }
  return res.status(statusCode).json({ success: false, message: errorMessage });
});

export default app;