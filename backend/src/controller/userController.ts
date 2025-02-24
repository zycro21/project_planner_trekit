import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { UserModel } from "../models/User";
import { prisma } from "../config/database";
const { validationResult } = require("express-validator");
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Get All Users
const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.findAll();
    res.json(users);
    return;
  } catch (error) {
    res.status(500).json({
      message: "Terjadi Kesalahan Server",
      error,
    });
    return;
  }
};

// Get User By ID
const getUserById = async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const requestingUser = req.user; // Data user yang sedang login dari middleware

  try {
    // Jika role bukan admin dan user_id yang diminta bukan miliknya sendiri, tolak akses
    if (
      requestingUser?.role !== "ADMIN" &&
      requestingUser?.user_id !== user_id
    ) {
      res
        .status(403)
        .json({ message: "Anda Tidak Bisa Mengakses user_id User Lain" });
      return;
    }

    const user = await UserModel.findById(user_id);
    if (!user) {
      res.status(404).json({ message: "User Tidak Ditemukan" });
      return;
    }

    res.json(user);
    return;
  } catch (error) {
    res.status(500).json({
      message: "Terjadi Kesalahan Server",
      error,
    });
    return;
  }
};

// Fungsi untuk mengirim email verifikasi
const sendVerificationEmail = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Email pengirim
      pass: process.env.EMAIL_PASS, // Password email
    },
  });

  const verifyUrl = `${process.env.BASE_URL}/api/users/verify-email/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verifikasi Email Anda",
    text: `Klik link berikut untuk verifikasi akun Anda: ${verifyUrl}`,
    html: `<p>Klik link berikut untuk verifikasi akun Anda:</p><a href="${verifyUrl}">Verifikasi Akun</a>`,
  };

  await transporter.sendMail(mailOptions);
};

// Register New User with Email Verification
const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  // Validasi Input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: errors.array(),
    });
    return;
  }

  try {
    // Cek apakah email sudah pernah digunakan
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(400).json({
        message: "Email Sudah Terdaftar",
      });
      return;
    }

    // Create user_id based on Role
    const rolePrefix = role === "ADMIN" ? "ADMIN" : "USER";
    const userCount = await UserModel.countByRole(role);
    const userId = `${rolePrefix}-${String(userCount + 1).padStart(4, "0")}`;

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Buat token verifikasi
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 3600000); // Berlaku 1 jam

    // Create new user
    const newUser = await UserModel.create({
      user_id: userId,
      name,
      email,
      password_hash: hashedPassword,
      role: role || "USER",
      is_verified: false,
      verification_token: verificationToken,
      verification_expires: verificationExpires,
      reset_password_token: null, // Tambahkan nilai default null
      reset_password_expires: null, // Tambahkan nilai default null
    });

    // Kirim email verifikasi
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      message: "Registrasi berhasil! Silakan cek email Anda untuk verifikasi.",
      user: newUser,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Terjadi Kesalahan Server",
      error,
    });
    return;
  }
};

const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const user = await UserModel.findByVerificationToken(token);

    if (!user) {
      res.status(400).json({ message: "Token tidak valid atau kadaluarsa." });
      return;
    }

    await UserModel.verifyUserEmail(user.user_id);
    res.status(200).json({
      message: "Email berhasil diverifikasi. Anda bisa login sekarang.",
    });
    return;
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan.", error });
    return;
  }
};

const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findByEmail(email);

    if (!user) {
      res.status(404).json({ message: "User tidak ditemukan." });
      return;
    }
    if (user.is_verified) {
      res.status(400).json({ message: "Email sudah diverifikasi." });
      return;
    }

    // Generate token baru
    const verificationToken = crypto.randomBytes(32).toString("hex");
    await UserModel.saveVerificationToken(user.user_id, verificationToken);

    // Kirim ulang email verifikasi
    await sendVerificationEmail(email, verificationToken);

    res.status(200).json({ message: "Email verifikasi telah dikirim ulang." });
    return;
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan.", error });
    return;
  }
};

const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validasi input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  // Cek apakah password ada
  if (!password || typeof password !== "string") {
    res.status(400).json({ message: "Password tidak valid" });
    return;
  }

  try {
    // Cek apakah user ada di database
    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({ message: "Email atau password salah" });
      return;
    }

    // Pastikan password_hash ada
    if (!user.password_hash) {
      res.status(401).json({ message: "Password tidak ditemukan" });
      return;
    }

    // Periksa password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ message: "Email atau password salah" });
      return;
    }

    // Pastikan ada secret key untuk JWT
    if (!process.env.JWT_SECRET) {
      res.status(500).json({ message: "JWT_SECRET belum diatur di .env" });
      return;
    }

    // Buat token
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Simpan token di cookie
    res.cookie("token", token, {
      httpOnly: true, // Tidak bisa diakses JavaScript (aman dari XSS)
      secure: process.env.NODE_ENV === "production", // Hanya aktif di HTTPS saat production
      sameSite: "strict", // Melindungi dari CSRF
      maxAge: 60 * 60 * 12000, // Expire dalam 1 jam
    });

    // Kirim respons sukses
    res.json({
      message: "Login berhasil",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    return;
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error });
    return;
  }
};

const updateUser = async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const { name, email, role } = req.body;
  const requestUser = req.user;

  try {
    // Check if user will be update on database
    const existingUser = await prisma.users.findUnique({
      where: { user_id },
    });

    if (!existingUser) {
      res.status(404).json({
        message: "User Tidak Dapat Ditemukan",
      });
      return;
    }

    // "USER" role only can update his account
    if (requestUser?.role !== "ADMIN" && requestUser?.user_id !== user_id) {
      res.status(403).json({
        message:
          "Anda Tidak Diizinkan Melakukan Update Selain Akun Anda Sendiri",
      });
      return;
    }

    // Only update field that given on req.body
    const updateData: Partial<{
      name: string;
      email: string;
      role: "USER" | "ADMIN";
    }> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role && requestUser.role === "ADMIN") updateData.role = role; // only admin can change role

    const updatedUser = await UserModel.update(user_id, updateData);

    res.json({
      message: "User Berhasil Diperbarui",
      user: updatedUser,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Terjadi Kesalahan Server",
      error,
    });
    return;
  }
};

const deleteUser = async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const requestUser = req.user; // Data user yang login dari middleware

  try {
    // Cek apakah user yang akan dihapus ada di database
    const existingUser = await UserModel.findById(user_id);
    if (!existingUser) {
      res.status(404).json({ message: "User tidak ditemukan" });
      return;
    }

    // Pastikan hanya ADMIN yang bisa menghapus user
    if (requestUser?.role !== "ADMIN") {
      res.status(403).json({ message: "Anda Tidak Diizinkan Menghapus User" });
      return;
    }

    // Cegah admin menghapus akunnya sendiri
    if (requestUser?.user_id === user_id) {
      res
        .status(400)
        .json({ message: "Admin tidak bisa menghapus akunnya sendiri" });
      return;
    }

    // Hapus user
    await UserModel.delete(user_id);
    res.json({ message: "User berhasil dihapus" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error });
    return;
  }
};

// Update Password
const updatePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const requestingUser = req.user; // Data user yang sedang login dari middleware

  // Pastikan user sudah login
  if (!requestingUser) {
    res.status(401).json({ message: "Akses ditolak, Anda belum login" });
    return;
  }

  try {
    // Cari user berdasarkan ID dari token (hanya dirinya sendiri) dan ambil password_hash
    const user = await prisma.users.findUnique({
      where: { user_id: requestingUser.user_id },
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        password_hash: true, // Ambil password_hash di sini
      },
    });

    if (!user) {
      res.status(404).json({ message: "User tidak ditemukan" });
      return;
    }

    // Pastikan password_hash ada
    if (!user.password_hash) {
      res.status(400).json({ message: "Password tidak ditemukan" });
      return;
    }

    // Periksa apakah password lama benar
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ message: "Password lama salah" });
      return;
    }

    // Update password hanya untuk dirinya sendiri
    await UserModel.updatePassword(requestingUser.user_id, newPassword);

    res.json({ message: "Password berhasil diperbarui" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error });
    return;
  }
};

// Transporter untuk mengirim email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Email pengirim
    pass: process.env.EMAIL_PASS, // Password email
  },
});

// Controller Lupa Password
const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(404).json({ message: "Email ini tidak ditemukan" });
      return;
    }

    // Buat token reset password (berlaku 1 jam)
    const resetToken = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET_RESET_TOKEN as string,
      { expiresIn: "30m" }
    );

    // Simpan token di database
    await UserModel.saveResetToken(user.user_id, resetToken);

    // Buat link reset password
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Kirim email berisi link reset password
    await transporter.sendMail({
      from: `"Trekit Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Reset Password - TemuDataku",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="text-align: center; color: #007bff;">🔐 Reset Password</h2>
          <p>Halo,</p>
          <p>Anda baru saja meminta untuk mereset password akun Anda di <strong>Trekit</strong>. Jika ini bukan Anda, abaikan email ini.</p>
          <p>Untuk mereset password Anda, silakan klik tombol di bawah ini:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" style="background-color: #007bff; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Atau Anda juga bisa menyalin dan membuka link berikut di browser Anda:</p>
          <p style="word-break: break-word; background-color: #eee; padding: 10px; border-radius: 5px; font-family: monospace;">
            <a href="${resetLink}" style="color: #007bff;">${resetLink}</a>
          </p>
          <p><strong>Catatan:</strong> Link ini hanya berlaku selama <strong>30 menit</strong>.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="text-align: center; font-size: 12px; color: #777;">Trekit &copy; ${new Date().getFullYear()} - Semua Hak Dilindungi.</p>
        </div>
      `,
    });

    res.json({ message: "Link reset password telah dikirim ke email Anda" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error });
    return;
  }
};

const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  try {
    // Verifikasi token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_RESET_TOKEN as string
    ) as {
      user_id: string;
    };

    // Cari user berdasarkan token
    const user = await UserModel.findByResetToken(token);
    if (!user) {
      res
        .status(400)
        .json({ message: "Token tidak valid atau telah kadaluarsa" });
      return;
    }

    // Update password baru
    await UserModel.updatePassword(decoded.user_id, newPassword);

    res.json({ message: "Password berhasil diperbarui" });
    return;
  } catch (error) {
    res
      .status(400)
      .json({ message: "Token tidak valid atau telah kadaluarsa" });
    return;
  }
};

export {
  registerUser,
  getUsers,
  getUserById,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  updateUser,
  deleteUser,
  updatePassword,
  forgotPassword,
  resetPassword,
};
