import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { activatePremiumKey } from "../controllers/premium.controller";

const router = Router();

router.post("/activate", requireAuth, activatePremiumKey);

export default router;
