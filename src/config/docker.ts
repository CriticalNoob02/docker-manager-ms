import Dockerode from "dockerode";
import logger from "./logger";

const docker = new Dockerode({ socketPath: "/var/run/docker.sock" });

export async function pingDocker(): Promise<void> {
  try {
    await docker.ping();
    logger.info("🐳 Conectado ao Docker daemon");
  } catch {
    logger.error("❌ Não foi possível conectar ao Docker daemon. Verifique se o Docker está rodando e se /var/run/docker.sock está acessível.");
    process.exit(1);
  }
}

export default docker;
