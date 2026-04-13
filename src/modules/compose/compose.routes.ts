import { Router } from "express";
import { list, getGraph } from "./compose.controller";

const router = Router();

router.get("/", list);
router.get("/graph", getGraph);

export default router;
