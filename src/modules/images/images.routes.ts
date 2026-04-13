import { Router } from "express";
import * as controller from "./images.controller";

const router = Router();

router.get("/", controller.list);
router.delete("/:id", controller.removeImage);

export default router;
