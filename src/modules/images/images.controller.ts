import { Request, Response, NextFunction } from "express";
import * as service from "./images.service";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const images = await service.listAll();
    res.json(images);
  } catch (err) {
    next(err);
  }
}

export async function removeImage(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(req.params["id"] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
