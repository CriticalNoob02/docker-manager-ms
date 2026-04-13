import { Router } from "express";
import * as controller from "./networks.controller";

const router = Router();

router.get("/", controller.list);
router.post("/", controller.createNetwork);
router.delete("/:id", controller.removeNetwork);

export default router;
