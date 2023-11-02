import express, { Request, Response, NextFunction } from "express";
import createHttpError, { isHttpError } from "http-errors";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "@/routes/auth.route";
import userRoutes from "@/routes/user.route";

const app = express();

// Middlewares
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// Error handling middlewares
app.use((_req, _res, next: NextFunction) => {
  next(createHttpError(404, "Endpoint not found"));
});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  let errorMessage = "An unknown error occurred.";
  let statusCode = 500;
  let errors = null;

  if (isHttpError(error)) {
    statusCode = error.status;
    errorMessage = error.message;
    if(error.errors) errors = error.errors;
  }
  return res.status(statusCode).json({ success: false, message: errorMessage, errors });
});

export default app;