import { Router } from "express";
import * as controller from "./containers.controller";

const router = Router();

router.get("/", controller.list);
router.post("/", controller.createContainer);
router.get("/:id", controller.get);
router.post("/:id/start", controller.startContainer);
router.post("/:id/stop", controller.stopContainer);
router.post("/:id/restart", controller.restartContainer);
router.delete("/:id", controller.removeContainer);
router.patch("/:id/meta", controller.updateMeta);

export default router;
