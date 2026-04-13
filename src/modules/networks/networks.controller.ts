import { Request, Response, NextFunction } from "express";
import * as service from "./networks.service";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listAll());
  } catch (err) {
    next(err);
  }
}

export async function removeNetwork(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(req.params["id"] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function createNetwork(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, driver } = req.body as { name: string; driver?: string };
    const network = await service.create(name, driver);
    res.status(201).json(network);
  } catch (err) {
    next(err);
  }
}
