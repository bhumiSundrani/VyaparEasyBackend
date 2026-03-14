import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwtTokenManagement";
import { AuthRequest } from "../types/AuthRequest";
import { User } from "../types/User";

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await verifyToken(token);
    req.user = user as User
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
