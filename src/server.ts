require("dotenv").config();
import http from "http";
import app from "./app";
import { pingDocker } from "./config/docker";
import logger from "./config/logger";
import { initSocket } from "./socket/index";

const PORT = process.env.PORT || 3001;

async function main() {
  await pingDocker();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    logger.info(`🚀 API rodando em http://localhost:${PORT}`);
  });
}

main();
