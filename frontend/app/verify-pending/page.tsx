"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Next.js 13+
import axios from "axios";
import { toast } from "react-toastify";

const VerifyPending = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  // Ambil email dari localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) setEmail(storedEmail);
  }, []);

  // Cek status verifikasi user setiap 5 detik
  useEffect(() => {
    const checkVerification = async () => {
      if (!email) return;

      try {
        const response = await axios.post(
          "http://localhost:5000/api/users/check-verification",
          { email }
        );
        if (response.data.is_verified) {
          toast.success("Email berhasil diverifikasi! Silakan login.");
          localStorage.removeItem("email"); // Hapus email dari localStorage
          router.push("/login");
        }
      } catch (error) {
        console.error("Gagal mengecek status verifikasi:", error);
      }
    };

    const interval = setInterval(checkVerification, 5000);
    return () => clearInterval(interval);
  }, [email, router]);

  // Kirim ulang email verifikasi
  const handleResendEmail = async () => {
    if (!email) {
      toast.error("Email tidak ditemukan!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/resend-verification",
        { email }
      );

      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Gagal mengirim ulang email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white px-4">
      <div className="text-center max-w-lg">
        <h2 className="text-2xl font-bold text-blue-900">
          Cek Email Anda untuk Verifikasi
        </h2>
        <p className="text-gray-600 mt-2">
          Kami telah mengirim email verifikasi. Silakan cek email Anda.
        </p>

        {/* Tombol untuk Buka Gmail */}
        <a
          href="https://mail.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-400 text-white px-6 py-2 mt-4 rounded-md font-semibold
          hover:bg-blue-500 transition duration-300 transform hover:scale-105 active:scale-95"
        >
          Buka Gmail
        </a>

        {/* Tombol Resend Email */}
        <button
          onClick={handleResendEmail}
          className="block w-full max-w-xs mt-3 bg-gray-500 text-white px-6 py-2 rounded-md font-semibold
          hover:bg-gray-600 transition duration-300 transform hover:scale-105 active:scale-95 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "Mengirim Ulang..." : "Kirim Ulang Email Verifikasi"}
        </button>

        {/* Navigasi ke Login / Register */}
        <div className="mt-4 flex justify-center gap-6">
          <button
            onClick={() => router.push("/login")}
            className="text-blue-500 font-semibold hover:underline hover:text-blue-700 transition duration-200"
          >
            Ke Halaman Login
          </button>
          <button
            onClick={() => router.push("/register")}
            className="text-blue-500 font-semibold hover:underline hover:text-blue-700 transition duration-200"
          >
            Ke Halaman Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyPending;
