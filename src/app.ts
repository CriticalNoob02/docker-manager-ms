import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import containerRoutes from "./modules/containers/containers.routes";
import imageRoutes from "./modules/images/images.routes";
import volumeRoutes from "./modules/volumes/volumes.routes";
import networkRoutes from "./modules/networks/networks.routes";
import composeRoutes from "./modules/compose/compose.routes";
import metricsRoutes from "./modules/metrics/metrics.routes";
import learnRoutes from "./modules/learn/learn.routes";
import swarmRoutes from "./modules/swarm/swarm.routes";
import { AppError } from "./utils/errors";

const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const app = express();

app.use(cors({ origin: CORS_ORIGIN.split(","), credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/containers", containerRoutes);
app.use("/images", imageRoutes);
app.use("/volumes", volumeRoutes);
app.use("/networks", networkRoutes);
app.use("/compose", composeRoutes);
app.use("/metrics", metricsRoutes);
app.use("/learn", learnRoutes);
app.use("/swarm", swarmRoutes);

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Erro interno do servidor" });
});

export default app;
