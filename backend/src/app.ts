import express from "express";
import cors from "cors";
import helmet from "helmet";

import routes from "./routes/index.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.use("/api", routes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;