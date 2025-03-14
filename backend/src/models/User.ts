import { PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export interface Users {
  user_id: string;
  name: string | null;
  email: string;
  password_hash?: string; // Menjadikan opsional
  role: "USER" | "ADMIN";
  is_verified?: boolean; // Menjadikan opsional
  verification_token: string | null; // Ubah menjadi string | null
  verification_expires?: Date | null; // Ubah menjadi Date | null
  reset_password_token: string | null; // Ubah menjadi string | null
  reset_password_expires: Date | null; // Ubah menjadi Date | null
  created_at?: Date | null;
}

interface UserCreateInput {
  user_id: string;
  email: string;
  name: string | null;
  password_hash: string;
  role: "USER" | "ADMIN";
  is_verified?: boolean;
  verification_token?: string | null;
  verification_expires?: Date | null;
  reset_password_token?: string | null;
  reset_password_expires?: Date | null;
}

export type Roles = "USER" | "ADMIN";

export class UserModel {
  // Ambil semua user
  static async findAll({
    sort = "ASC",
    role,
    search,
    email,
  }: {
    sort?: "ASC" | "DESC";
    role?: string;
    search?: string;
    email?: string;
  }): Promise<
    Pick<Users, "user_id" | "name" | "email" | "role" | "created_at" | "is_verified">[]
  > {
    return await prisma.user.findMany({
      where: {
        ...(role ? { role: role as Role } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...(email ? { email: { contains: email, mode: "insensitive" } } : {}), 
      },
      orderBy: {
        user_id: sort === "DESC" ? "desc" : "asc", // Sorting berdasarkan user_id
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        is_verified: true,
      },
    });
  }

  // Hitung jumlah user berdasarkan role
  static async countByRole(role: Roles): Promise<number> {
    return await prisma.user.count({
      where: { role },
    });
  }

  // Cari user berdasarkan ID
  static async findById(
    user_id: string
  ): Promise<Pick<
    Users,
    "user_id" | "name" | "email" | "role" | "created_at"
  > | null> {
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
  static async findByEmail(email: string): Promise<Users | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  // Buat user baru
  static async create(user: UserCreateInput): Promise<Users> {
    // Pastikan password_hash didefinisikan
    if (!user.password_hash) {
      throw new Error("Password hash harus disediakan");
    }

    return await prisma.user.create({
      data: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        password_hash: user.password_hash,
        role: user.role,
        verification_token: user.verification_token || null, // Opsional
        verification_expires: user.verification_expires || null, // Opsional
        reset_password_token: user.reset_password_token || null, // Opsional
        reset_password_expires: user.reset_password_expires || null, // Opsional
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        verification_token: true, // Pastikan properti ini ada
        reset_password_token: true, // Pastikan properti ini ada
        reset_password_expires: true, // Pastikan properti ini ada
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

  // Update Password
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
