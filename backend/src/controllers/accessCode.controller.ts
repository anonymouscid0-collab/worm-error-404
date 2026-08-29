import { Request, Response } from 'express';
import { prisma } from "../config/prisma";

const VALID_CODES = [
  { name: "cid-fsociety", password: "cid_error404-tech", email: "anonymouscid0@gmail.com" }
];

export async function verifyAccessCode(req: Request, res: Response) {
  const { name, password } = req.body;
  
  const valid = VALID_CODES.find(c => c.name === name && c.password === password);
  
  if (!valid) {
    return res.status(401).json({ error: "Code d'accès invalide." });
  }
  
  return res.json({ 
    success: true, 
    message: "Accès autorisé.",
    email: valid.email
  });
}
