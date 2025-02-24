import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export interface User {
  user_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "USER" | "ADMIN";
  is_verified: boolean;
  verification_token?: string;
  verification_expires?: Date;
  created_at?: Date;
}

export class UserModel {
  // Ambil semua user
  static async findAll(): Promise<User[]> {
    return await prisma.user.findMany({
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });
  }

  // Hitung jumlah user berdasarkan role
  static async countByRole(role: string): Promise<number> {
    return await prisma.user.count({
      where: { role },
    });
  }

  // Cari user berdasarkan ID
  static async findById(user_id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { user_id },
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });
  }

  // Cari user berdasarkan email
  static async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  // Buat user baru
  static async create(user: User): Promise<User> {
    return await prisma.user.create({
      data: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role,
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });
  }

  // Update user
  static async update(
    user_id: string,
    data: Partial<{ name: string; email: string; role: "USER" | "ADMIN" }>
  ) {
    return await prisma.user.update({
      where: { user_id },
      data,
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });
  }

  // Hapus user
  static async delete(user_id: string): Promise<void> {
    await prisma.user.delete({
      where: { user_id },
    });
  }

  // Update Password (Hanya untuk dirinya sendiri)
  static async updatePassword(
    user_id: string,
    newPassword: string
  ): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { user_id },
      data: { password_hash: hashedPassword },
    });
  }

  // Simpan token reset password di database
  static async saveResetToken(user_id: string, resetToken: string) {
    await prisma.user.update({
      where: { user_id },
      data: {
        reset_password_token: resetToken,
        reset_password_expires: new Date(Date.now() + 1800000),
      },
    });
  }

  // Cari user berdasarkan token reset password
  static async findByResetToken(token: string) {
    return await prisma.user.findFirst({
      where: {
        reset_password_token: token,
        reset_password_expires: { gt: new Date() },
      },
    });
  }

  // Update password setelah reset
  static async updateResetPassword(user_id: string, newPassword: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { user_id },
      data: {
        password_hash: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
      },
    });
  }

  // Simpan Token Verifikasi Email
  static async saveVerificationToken(user_id: string, token: string) {
    await prisma.user.update({
      where: { user_id },
      data: {
        verification_token: token,
        verification_expires: new Date(Date.now() + 3600000), // Token berlaku 1 jam
      },
    });
  }

  // Cari user berdasarkan token verifikasi email
  static async findByVerificationToken(token: string) {
    return await prisma.user.findFirst({
      where: {
        verification_token: token,
        verification_expires: { gt: new Date() },
      },
    });
  }

  // Verifikasi email user
  static async verifyUserEmail(user_id: string) {
    await prisma.user.update({
      where: { user_id },
      data: {
        is_verified: true,
        verification_token: null,
        verification_expires: null,
      },
    });
  }
}
