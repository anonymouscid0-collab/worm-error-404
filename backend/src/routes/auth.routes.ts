import { Router } from 'express';
import { verifyApiKey } from '../middleware/auth';

const router = Router();

router.get('/status', verifyApiKey, (req, res) => {
  res.json({
    status: 'online',
    message: 'Clé API valide !',
    user: (req as any).userApi
  });
});

export default router;
