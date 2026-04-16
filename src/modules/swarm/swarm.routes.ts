import { Router } from "express";
import * as controller from "./swarm.controller";

const router = Router();

// Info
router.get("/info", controller.getInfo);
router.post("/init", controller.initSwarm);
router.get("/join-tokens", controller.getJoinTokens);
router.post("/leave", controller.leaveSwarm);

// Nodes
router.get("/nodes", controller.listNodes);
router.get("/nodes/:id", controller.getNode);
router.put("/nodes/:id", controller.updateNode);
router.delete("/nodes/:id", controller.removeNode);

// Services
router.get("/services", controller.listServices);
router.get("/services/:id", controller.getService);
router.patch("/services/:id/scale", controller.scaleService);
router.delete("/services/:id", controller.removeService);
router.get("/services/:id/tasks", controller.listServiceTasks);

// Tasks
router.get("/tasks", controller.listTasks);

// Stacks
router.get("/stacks", controller.listStacks);
router.post("/stacks/:name", controller.deployStack);
router.delete("/stacks/:name", controller.removeStack);

export default router;
