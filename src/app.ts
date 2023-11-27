import express, { Request, Response, NextFunction } from "express";
import createHttpError, { isHttpError } from "http-errors";
import morgan from "morgan";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
// import authRoutes from "@/routes/auth.route";
// import userRoutes from "@/routes/user.route";
import { RegisterRoutes } from "./routes/routes";
import { ValidateError } from "tsoa";

const app = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Creed API is live');
});

// Middlewares
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  "/docs",
  swaggerUi.serve,
  async (_req: Request, res: Response) => {
    return res.send(
      swaggerUi.generateHTML(await import("./utils/swagger.json"))
    );
  }
  // swaggerUi.setup(undefined, {
  //   swaggerOptions: {
  //     url: "/swagger.json",
  //   },
  // })
);

// routes
// app.use("/api/auth", authRoutes);
// app.use("/api/user", userRoutes);
RegisterRoutes(app);

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
  } else if(error instanceof ValidateError) {
    errorMessage = "Validation error"
    errors = error.fields;
  }
  return res.status(statusCode).json({ success: false, message: errorMessage, errors });
});

export default app;