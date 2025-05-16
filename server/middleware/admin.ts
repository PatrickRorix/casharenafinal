import { Request, Response, NextFunction } from "express";

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized, please login" });
}

// Middleware to check if user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized, please login" });
  }
  
  // Check if user has admin role
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({ message: "Forbidden: Administrator access required" });
}