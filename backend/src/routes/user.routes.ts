import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { me } from "../controllers/auth.controller";

const router = Router();

router.get("/profile", requireAuth, me);

export default router;
