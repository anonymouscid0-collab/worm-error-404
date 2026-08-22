import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
  apiKey?: string;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant. Format: Bearer <token>' });
    }
    
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, env.jwtSecret) as { userId: string; role: string };
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
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
