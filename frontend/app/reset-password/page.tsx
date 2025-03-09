"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token reset password tidak ditemukan atau tidak valid.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Password baru dan konfirmasi password tidak cocok.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(
        `http://localhost:5000/api/users/reset-password`,
        {
          token,
          newPassword,
        }
      );
      setSuccess(response.data.message);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Terjadi kesalahan, coba lagi nanti."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-md shadow-md w-96">
        <h2 className="text-2xl font-semibold text-center text-blue-600">
          Reset Password
        </h2>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        {success && (
          <p className="text-green-500 text-center mt-2">{success}</p>
        )}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-gray-700">Password Baru</label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full p-2 border rounded-md"
                placeholder="Masukkan password baru"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-4 text-gray-600 hover:text-gray-800"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <div>
              <label className="block text-gray-700">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                className="w-full p-2 border rounded-md"
                placeholder="Konfirmasi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className={`w-full bg-blue-500 text-white py-2 rounded-md ${
                isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-700"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Mengganti..." : "Ganti Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
