import docker from "../../config/docker";
import { NotFoundError } from "../../utils/errors";

export async function listAll() {
  return docker.listImages({ all: false });
}

export async function remove(id: string) {
  const image = docker.getImage(id);
  try {
    await image.remove({ force: true });
  } catch {
    throw new NotFoundError("Image");
  }
}
