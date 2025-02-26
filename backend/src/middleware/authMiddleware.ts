import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend "Request" untuk menyimpan user di "req"
declare global {
  namespace Express {
    interface Request {
      user?: { user_id: string; role: string };
    }
  }
}

// Middleware memastikan user sudah login (token valid)
const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({
      message: "Akses Ditolak, Anda Belum Login",
    });

    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      user_id: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Token Tidak Valid atau Token Kadaluarsa",
    });

    return;
  }
};

// Middleware hanya bisa diakses oleh role ADMIN
const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ message: "Akses ditolak, user belum login" });
    return;
  }

  if (req.user.role !== "ADMIN") {
    res
      .status(403)
      .json({ message: "Akses ditolak, hanya admin yang bisa mengakses" });
    return;
  }

  next();
};

// Middleware bisa diakses oleh semua role
const authorizeAllUsers = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ message: "Akses ditolak, user belum login" });
    return;
  }

  next();
};

export { authenticateUser, authorizeAdmin, authorizeAllUsers };
