import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import logger from "../config/logger";
import docker from "../config/docker";
import { registerContainerHandlers, registerImageHandlers, cleanupSocketStreams } from "./handlers";

const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

export function initSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: CORS_ORIGIN.split(","),
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const dockerNs = io.of("/docker");

  // Broadcast container lifecycle events to all connected clients
  docker.getEvents({ filters: { type: ["container"] } }, (err, stream) => {
    if (err || !stream) {
      logger.error("Não foi possível assinar eventos do Docker");
      return;
    }

    stream.on("data", (chunk: Buffer) => {
      try {
        const event = JSON.parse(chunk.toString("utf8"));
        dockerNs.emit("container:event", {
          action: event.Action,
          id: event.Actor?.ID?.substring(0, 12) ?? "",
          name: event.Actor?.Attributes?.name ?? "",
        });
      } catch {
        // skip malformed event
      }
    });

    stream.on("error", (e: Error) => {
      logger.error(`Docker event stream error: ${e.message}`);
    });
  });

  dockerNs.on("connection", (socket) => {
    logger.info(`🔗 Socket conectado: ${socket.id}`);

    registerContainerHandlers(io, socket);
    registerImageHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      cleanupSocketStreams(socket.id);
      logger.info(`❌ Socket desconectado: ${socket.id} - ${reason}`);
    });

    socket.on("error", (err) => {
      logger.error(`Erro no socket ${socket.id}: ${err.message}`);
    });
  });

  return io;
}
