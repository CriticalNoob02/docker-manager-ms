import docker from "../../config/docker";
import { NotFoundError } from "../../utils/errors";

export async function listAll() {
  return docker.listNetworks();
}

export async function remove(id: string) {
  const network = docker.getNetwork(id);
  try {
    await network.remove();
  } catch {
    throw new NotFoundError("Network");
  }
}

export async function create(name: string, driver: string = "bridge") {
  return docker.createNetwork({ Name: name, Driver: driver });
}
