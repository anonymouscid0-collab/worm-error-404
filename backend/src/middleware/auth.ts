import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: any;
  apiKey?: string;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Accès non autorisé.' });
    }
    req.user = { id: 'user_id', role: 'user' };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide.' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé. Admin requis.' });
  }
  next();
};

export const verifyApiKey = (req: AuthRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (!apiKey) {
    return res.status(401).json({ error: 'Clé API manquante.' });
  }
  req.apiKey = apiKey as string;
  next();
};

