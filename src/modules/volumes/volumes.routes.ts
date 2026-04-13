import { Router } from "express";
import * as controller from "./volumes.controller";

const router = Router();

router.get("/", controller.list);
router.post("/", controller.createVolume);
router.delete("/:name", controller.removeVolume);

export default router;
