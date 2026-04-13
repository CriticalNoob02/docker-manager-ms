import { Request, Response, NextFunction } from "express";
import * as service from "./volumes.service";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listAll());
  } catch (err) {
    next(err);
  }
}

export async function removeVolume(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(req.params["name"] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function createVolume(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, driver } = req.body as { name: string; driver?: string };
    const volume = await service.create(name, driver);
    res.status(201).json(volume);
  } catch (err) {
    next(err);
  }
}
