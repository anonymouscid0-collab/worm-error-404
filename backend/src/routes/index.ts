import { Router } from 'express';
import multer from 'multer';

import * as authController from '../controllers/auth.controller';
import * as chatController from '../controllers/chat.controller';
import * as adminController from '../controllers/admin.controller';
import * as premiumController from '../controllers/premium.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Configuration Multer pour uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/', 'application/zip', 'application/pdf', 'text/'];
    if (allowed.some(t => file.mimetype.startsWith(t))) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

// ========== AUTH ==========
router.post('/api/auth/register', authController.register);
router.post('/api/access/verify', accessController.verifyAccessCode);
router.post('/api/auth/login', authController.login);
router.post('/api/auth/refresh', authController.refresh);
router.post('/api/auth/logout', authController.logout);
router.get('/api/auth/me', requireAuth, authController.me);

// ========== CHAT ==========
router.get('/api/chat/conversations', requireAuth, chatController.listConversations);
router.post('/api/chat/conversations', requireAuth, chatController.createConversation);
router.get('/api/chat/conversations/:id', requireAuth, chatController.getConversation);
router.patch('/api/chat/conversations/:id/theme', requireAuth, chatController.updateConversationTheme);
router.delete('/api/chat/conversations/:id', requireAuth, chatController.deleteConversation);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/api/chat/messages', requireAuth, upload.array('files') as any, chatController.sendMessage);

// ========== PREMIUM ==========
router.post('/api/premium/activate', requireAuth, premiumController.activatePremiumKey);

// ========== ADMIN ==========
router.get('/api/admin/stats', requireAuth, requireAdmin, adminController.getStats);
router.get('/api/admin/users', requireAuth, requireAdmin, adminController.listUsers);
router.patch('/api/admin/users/:id/plan', requireAuth, requireAdmin, adminController.updateUserPlan);
router.delete('/api/admin/users/:id', requireAuth, requireAdmin, adminController.deleteUser);
router.get('/api/admin/premium-keys', requireAuth, requireAdmin, adminController.listPremiumKeys);
router.post('/api/admin/premium-keys', requireAuth, requireAdmin, adminController.createPremiumKeys);
router.get('/api/admin/conversations', requireAuth, requireAdmin, adminController.listAllConversations);
router.get('/api/admin/settings', requireAuth, requireAdmin, adminController.getSettings);
router.put('/api/admin/settings', requireAuth, requireAdmin, adminController.upsertSetting);
router.get('/api/admin/api-keys', requireAuth, requireAdmin, adminController.listApiKeys);
router.post('/api/admin/api-keys', requireAuth, requireAdmin, adminController.createApiKey);
router.delete('/api/admin/api-keys/:id', requireAuth, requireAdmin, adminController.deleteApiKey);
router.post('/api/admin/ai-test', requireAuth, requireAdmin, adminController.testAi);

export default router;
