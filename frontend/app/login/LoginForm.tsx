"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa"; // Icon untuk show/hide password

const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // State untuk lupa password
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/login",
        { email, password },
        { withCredentials: true }
      );

      const userRole = response.data.user.role;
      if (userRole === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login gagal. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle lupa password
  const handleForgotPassword = async () => {
    setForgotMessage("");
    setIsSending(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/forgot-password",
        { email: forgotEmail }
      );
      setForgotMessage(response.data.message);
    } catch (err: any) {
      setForgotMessage(
        err.response?.data?.message || "Terjadi kesalahan. Coba lagi."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">
          Login
        </h2>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-center bg-red-100 p-2 rounded">
            {error}
          </p>
        )}

        {/* Input Email */}
        <div>
          <label className="block text-gray-700 mb-2">Email</label>
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-4 text-gray-400" />
            <input
              type="email"
              className="border border-gray-300 bg-white p-3 pl-10 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Input Password */}
        <div>
          <label className="block text-gray-700 mb-2">Password</label>
          <div className="relative">
            <FaLock className="absolute left-3 top-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              className="border border-gray-300 bg-white p-3 pl-10 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </div>

        {/* Tombol Login */}
        <button
          type="submit"
          className={`w-full bg-blue-500 text-white py-2 rounded-md transition duration-300 ${
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Memproses..." : "Login"}
        </button>

        {/* Lupa Password */}
        <p className="text-center">
          <button
            type="button"
            className="text-blue-500 hover:underline hover:text-blue-700 transition"
            onClick={() => setForgotPasswordOpen(true)}
          >
            Lupa Password?
          </button>
        </p>

        {/* Link ke Register */}
        <p className="text-gray-600 text-sm text-center">
          Belum punya akun?{" "}
          <a
            href="/register"
            className="text-blue-500 hover:underline hover:text-blue-700 transition"
          >
            Daftar di sini
          </a>
        </p>
      </form>

      {/* Modal Lupa Password */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Lupa Password
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              Masukkan email Anda untuk menerima link reset password.
            </p>

            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Masukkan email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />

            {forgotMessage && (
              <p className="text-sm text-center mt-2 text-gray-600">
                {forgotMessage}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setForgotPasswordOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition"
              >
                Batal
              </button>
              <button
                onClick={handleForgotPassword}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 transition"
                disabled={isSending}
              >
                {isSending ? "Mengirim..." : "Kirim"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginForm;
