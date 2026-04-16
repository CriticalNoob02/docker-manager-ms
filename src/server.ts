require("dotenv").config();
import http from "http";
import app from "./app";
import { pingDocker, isSwarmActive } from "./config/docker";
import logger from "./config/logger";
import { initSocket } from "./socket/index";

const PORT = process.env.PORT || 3001;

async function main() {
  await pingDocker();

  const swarm = await isSwarmActive();
  if (swarm) {
    logger.info("🐝 Swarm mode detectado — rotas /swarm ativas");
  } else {
    logger.info("🖥️  Modo standalone — Swarm não ativo");
  }

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    logger.info(`🚀 API rodando em http://localhost:${PORT}`);
  });
}

main();
