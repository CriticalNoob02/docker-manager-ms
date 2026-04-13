import { Request, Response, NextFunction } from "express";
import * as service from "./metrics.service";

export async function getMetrics(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getMetrics();
    res.json(data);
  } catch (err) {
    next(err);
  }
}
