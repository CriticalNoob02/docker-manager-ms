import { Request, Response, NextFunction } from "express";
import * as service from "./swarm.service";

export async function getInfo(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getSwarmInfo());
  } catch (err) {
    next(err);
  }
}

export async function initSwarm(req: Request, res: Response, next: NextFunction) {
  try {
    const { advertiseAddr } = req.body as { advertiseAddr?: string };
    const tokens = await service.initSwarm(advertiseAddr);
    res.status(201).json(tokens);
  } catch (err) {
    next(err);
  }
}

export async function getJoinTokens(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getJoinTokens());
  } catch (err) {
    next(err);
  }
}

export async function leaveSwarm(req: Request, res: Response, next: NextFunction) {
  try {
    const { force = false } = req.body as { force?: boolean };
    await service.leaveSwarm(force);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── Nodes ───────────────────────────────────────────────────────────────────

export async function listNodes(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listNodes());
  } catch (err) {
    next(err);
  }
}

export async function getNode(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.inspectNode(req.params["id"] as string));
  } catch (err) {
    next(err);
  }
}

export async function updateNode(req: Request, res: Response, next: NextFunction) {
  try {
    const { role, availability } = req.body as { role: "manager" | "worker"; availability: "active" | "pause" | "drain" };
    await service.updateNode(req.params["id"] as string, role, availability);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function removeNode(req: Request, res: Response, next: NextFunction) {
  try {
    await service.removeNode(req.params["id"] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function listServices(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listServices());
  } catch (err) {
    next(err);
  }
}

export async function getService(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.inspectService(req.params["id"] as string));
  } catch (err) {
    next(err);
  }
}

export async function scaleService(req: Request, res: Response, next: NextFunction) {
  try {
    const { replicas } = req.body as { replicas: number };
    await service.scaleService(req.params["id"] as string, replicas);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function removeService(req: Request, res: Response, next: NextFunction) {
  try {
    await service.removeService(req.params["id"] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listTasks());
  } catch (err) {
    next(err);
  }
}

export async function listServiceTasks(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listTasks(req.params["id"] as string));
  } catch (err) {
    next(err);
  }
}

// ─── Stacks ──────────────────────────────────────────────────────────────────

export async function listStacks(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listStacks());
  } catch (err) {
    next(err);
  }
}

export async function deployStack(req: Request, res: Response, next: NextFunction) {
  try {
    const name = req.params["name"] as string;
    const { composeYaml } = req.body as { composeYaml: string };
    await service.deployStack(name, composeYaml);
    res.status(201).json({ name });
  } catch (err) {
    next(err);
  }
}

export async function removeStack(req: Request, res: Response, next: NextFunction) {
  try {
    await service.removeStack(req.params["name"] as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
