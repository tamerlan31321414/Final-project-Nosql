import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import meRoutes from "./routes/me.routes.js";

import { notFound, errorHandler } from "./middlewares/error.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/v1/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/quizzes", quizRoutes);
  app.use("/api/v1/me", meRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
