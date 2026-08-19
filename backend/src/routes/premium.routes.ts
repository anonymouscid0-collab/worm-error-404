import { Router, Request, Response } from 'express';
import { verifyApiKey } from '../middleware/auth';

const router = Router();

router.post('/execute', verifyApiKey, (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Accès aux fonctions Premium autorisé.',
    user: (req as any).userApi
  });
});

export default router;
