import { Request, Response, NextFunction } from "express";
import * as service from "./containers.service";
import type { CreateContainerOptions } from "./containers.service";
import { upsertDescription } from "./meta.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const containers = await service.listAll();
    res.json(containers);
  } catch (err) {
    next(err);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.inspect(req.params["id"] as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function startContainer(req: Request, res: Response, next: NextFunction) {
  try {
    await service.start(req.params["id"] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function stopContainer(req: Request, res: Response, next: NextFunction) {
  try {
    await service.stop(req.params["id"] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function restartContainer(req: Request, res: Response, next: NextFunction) {
  try {
    await service.restart(req.params["id"] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function removeContainer(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(req.params["id"] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function createContainer(req: Request, res: Response, next: NextFunction) {
  try {
    const options = req.body as CreateContainerOptions;
    const id = await service.create(options);
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
}

export function updateMeta(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    const { description } = req.body as { description: string };
    upsertDescription(id, description ?? "");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
