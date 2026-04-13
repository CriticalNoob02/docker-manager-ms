import docker from "../../config/docker";
import { NotFoundError } from "../../utils/errors";
import { getAllMeta } from "./meta.service";

export async function listAll() {
  const [containers, meta] = await Promise.all([
    docker.listContainers({ all: true }),
    Promise.resolve(getAllMeta()),
  ]);
  return containers.map((c) => ({ ...c, description: meta[c.Id] ?? "" }));
}

export async function inspect(id: string) {
  const container = docker.getContainer(id);
  try {
    return await container.inspect();
  } catch {
    throw new NotFoundError("Container");
  }
}

export async function start(id: string) {
  const container = docker.getContainer(id);
  try {
    await container.start();
  } catch (err: any) {
    if (err?.statusCode === 304) return; // already running
    throw err;
  }
}

export async function stop(id: string) {
  const container = docker.getContainer(id);
  try {
    await container.stop();
  } catch (err: any) {
    if (err?.statusCode === 304) return; // already stopped
    throw err;
  }
}

export async function restart(id: string) {
  const container = docker.getContainer(id);
  await container.restart();
}

export async function remove(id: string) {
  const container = docker.getContainer(id);
  await container.remove({ force: true });
}
