import express from "express";
import {
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
  checkVerification,
  logoutUser
} from "../controller/userController";
import {
  authenticateUser,
  authorizeAdmin,
  authorizeAllUsers,
} from "../middleware/authMiddleware";

const router = express.Router();

// Public Routes
router.post("/register", registerUser); // Registrasi User
router.post("/login", loginUser); // Login User
router.post("/forgot-password", forgotPassword); // Lupa Password
router.post("/reset-password", resetPassword); // Reset Password
router.get("/verify-email/:token", verifyEmail); // Verifikasi Email
router.post("/check-verification", checkVerification);
router.post("/resend-verification", resendVerificationEmail); // Kirim Ulang Verifikasi Email
router.post("/logout", logoutUser);

// Protected Routes (Butuh Login)
router.get("/getUsers", authenticateUser, authorizeAdmin, getUsers); // Get All Users
router.get("/:user_id", authenticateUser, getUserById); // Get User By ID
router.put("/:user_id", authenticateUser, updateUser); // Update User
router.delete("/:user_id", authenticateUser, authorizeAdmin, deleteUser); // Delete User
router.post("/update-password", authenticateUser, updatePassword); // Update Password

export default router;
