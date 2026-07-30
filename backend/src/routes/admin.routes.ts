import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  listUsers,
  updateUserPlan,
  deleteUser,
  getStats,
  createPremiumKeys,
  listPremiumKeys,
  listAllConversations,
  getSettings,
  upsertSetting,
  listApiKeys,
  createApiKey,
  deleteApiKey,
  testAi,
} from "../controllers/admin.controller";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/users", listUsers);
router.patch("/users/:id/plan", updateUserPlan);
router.delete("/users/:id", deleteUser);

router.get("/stats", getStats);

router.get("/premium-keys", listPremiumKeys);
router.post("/premium-keys", createPremiumKeys);

router.get("/conversations", listAllConversations);

router.get("/settings", getSettings);
router.put("/settings", upsertSetting);

router.get("/api-keys", listApiKeys);
router.post("/api-keys", createApiKey);
router.delete("/api-keys/:id", deleteApiKey);

router.post("/ai-test", testAi);

export default router;
