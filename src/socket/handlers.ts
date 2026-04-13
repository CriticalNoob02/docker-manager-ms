import { Socket, Server } from "socket.io";
import { PassThrough } from "stream";
import docker from "../config/docker";
import logger from "../config/logger";

// Track active streams per socket to allow cleanup on disconnect
const activeStreams = new Map<string, Map<string, PassThrough | NodeJS.ReadableStream>>();

function getSocketStreams(socketId: string) {
  if (!activeStreams.has(socketId)) {
    activeStreams.set(socketId, new Map());
  }
  return activeStreams.get(socketId)!;
}

export function registerContainerHandlers(io: Server, socket: Socket) {
  // --- Logs ---
  socket.on("container:logs:subscribe", async ({ containerId, tail = 200 }: { containerId: string; tail?: number }) => {
    try {
      const container = docker.getContainer(containerId);
      const logStream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        tail,
        timestamps: true,
      });

      const stdout = new PassThrough();
      const stderr = new PassThrough();

      // demuxStream properly splits Docker multiplexed stream
      (container as any).modem.demuxStream(logStream, stdout, stderr);

      const emitLine = (chunk: Buffer) => {
        const line = chunk.toString("utf8").trimEnd();
        if (line) {
          socket.emit("container:logs:data", {
            containerId,
            line,
            timestamp: new Date().toISOString(),
          });
        }
      };

      stdout.on("data", emitLine);
      stderr.on("data", emitLine);

      logStream.on("error", (err: Error) => {
        socket.emit("container:logs:error", { containerId, error: err.message });
      });

      const streams = getSocketStreams(socket.id);
      streams.set(`logs:${containerId}`, logStream as unknown as NodeJS.ReadableStream);
    } catch (err: any) {
      socket.emit("container:logs:error", { containerId, error: err.message });
    }
  });

  socket.on("container:logs:unsubscribe", ({ containerId }: { containerId: string }) => {
    const streams = getSocketStreams(socket.id);
    const stream = streams.get(`logs:${containerId}`);
    if (stream) {
      (stream as any).destroy?.();
      streams.delete(`logs:${containerId}`);
    }
  });

  // --- Stats ---
  socket.on("container:stats:subscribe", async ({ containerId }: { containerId: string }) => {
    try {
      const container = docker.getContainer(containerId);
      const statsStream = await container.stats({ stream: true });

      statsStream.on("data", (chunk: Buffer) => {
        try {
          const stats = JSON.parse(chunk.toString("utf8"));

          const cpuDelta =
            stats.cpu_stats.cpu_usage.total_usage -
            stats.precpu_stats.cpu_usage.total_usage;
          const systemDelta =
            stats.cpu_stats.system_cpu_usage -
            stats.precpu_stats.system_cpu_usage;
          const numCpus = stats.cpu_stats.online_cpus ?? stats.cpu_stats.cpu_usage.percpu_usage?.length ?? 1;
          const cpu = systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0;

          const memory = stats.memory_stats.usage ?? 0;
          const memoryLimit = stats.memory_stats.limit ?? 0;

          socket.emit("container:stats:data", {
            containerId,
            cpu: parseFloat(cpu.toFixed(2)),
            memory: parseFloat((memory / 1024 / 1024).toFixed(2)),
            memoryLimit: parseFloat((memoryLimit / 1024 / 1024).toFixed(2)),
            timestamp: Date.now(),
          });
        } catch {
          // skip malformed chunk
        }
      });

      statsStream.on("error", (err: Error) => {
        logger.error(`Stats stream error for ${containerId}: ${err.message}`);
      });

      const streams = getSocketStreams(socket.id);
      streams.set(`stats:${containerId}`, statsStream);
    } catch (err: any) {
      logger.error(`Failed to start stats for ${containerId}: ${err.message}`);
    }
  });

  socket.on("container:stats:unsubscribe", ({ containerId }: { containerId: string }) => {
    const streams = getSocketStreams(socket.id);
    const stream = streams.get(`stats:${containerId}`);
    if (stream) {
      (stream as any).destroy?.();
      streams.delete(`stats:${containerId}`);
    }
  });
}

interface PullAuth {
  serveraddress: string; // e.g. "ghcr.io", "docker.io"
  username: string;
  password: string;      // PAT / token
}

export function registerImageHandlers(io: Server, socket: Socket) {
  socket.on(
    "image:pull:start",
    ({ image, tag = "latest", auth }: { image: string; tag?: string; auth?: PullAuth }) => {
      const fullImage = `${image}:${tag}`;

      const pullOptions = auth
        ? { authconfig: { serveraddress: auth.serveraddress, username: auth.username, password: auth.password } }
        : {};

      docker.pull(fullImage, pullOptions, (err: Error | null, stream?: NodeJS.ReadableStream) => {
        if (err || !stream) {
          socket.emit("image:pull:error", { image: fullImage, error: err?.message ?? "Stream inválido" });
          return;
        }

        docker.modem.followProgress(
          stream,
          (finalErr: Error | null) => {
            if (finalErr) {
              socket.emit("image:pull:error", { image: fullImage, error: finalErr.message });
            } else {
              socket.emit("image:pull:done", { image: fullImage });
            }
          },
          (event: { status: string; id?: string; progressDetail?: object }) => {
            socket.emit("image:pull:progress", {
              image: fullImage,
              status: event.status,
              id: event.id,
              progressDetail: event.progressDetail,
            });
          }
        );
      });
    }
  );
}

export function cleanupSocketStreams(socketId: string) {
  const streams = activeStreams.get(socketId);
  if (streams) {
    for (const stream of streams.values()) {
      (stream as any).destroy?.();
    }
    activeStreams.delete(socketId);
  }
}
