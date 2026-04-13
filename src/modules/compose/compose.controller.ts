import type { Request, Response, NextFunction } from "express";
import { listStacks, getStackGraph } from "./compose.service";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const stacks = await listStacks();
    res.json(stacks);
  } catch (err) {
    next(err);
  }
}

export async function getGraph(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.query["file"] as string | undefined;
    if (!file) {
      res.status(400).json({ error: "Query param 'file' is required" });
      return;
    }

    const includeVolumes = req.query["volumes"] === "true";
    const graph = await getStackGraph(file, { includeVolumes });
    res.json(graph);
  } catch (err) {
    next(err);
  }
}
