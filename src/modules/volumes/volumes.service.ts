import docker from "../../config/docker";
import { NotFoundError } from "../../utils/errors";

export async function listAll() {
  const result = await docker.listVolumes();
  return result.Volumes ?? [];
}

export async function remove(name: string) {
  const volume = docker.getVolume(name);
  try {
    await volume.remove({ force: true });
  } catch {
    throw new NotFoundError("Volume");
  }
}

export async function create(name: string, driver: string = "local") {
  return docker.createVolume({ Name: name, Driver: driver });
}
