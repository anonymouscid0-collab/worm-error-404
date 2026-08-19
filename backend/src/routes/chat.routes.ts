import { Router, Request, Response } from 'express';
import { verifyApiKey } from '../middleware/auth';
import wormBrain from '../services/wormBrainV3';

const router = Router();

router.post('/message', verifyApiKey, async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Le champ message est requis.' });
    }

    const userApi = (req as any).userApi;
    const aiResponse = await wormBrain.processRequest(message, userApi);

    return res.json({
      status: 'success',
      prompt: message,
      reply: aiResponse,
      user: userApi
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Erreur Brain IA',
      message: error.message
    });
  }
});

export default router;
