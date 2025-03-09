"use client";

import React, { useState } from "react";
import { FaUser, FaEnvelope, FaLock, FaEyeSlash, FaEye } from "react-icons/fa";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RegisterForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Confirm Password
    if (formData.password !== formData.confirmPassword) {
      toast.error("Konfirmasi Password Tidak Sesuai");
      return;
    }

    // Validasi Checkbox Syarat & Ketentuan
    if (!formData.agreeToTerms) {
      toast.error(
        "Anda harus menyetujui kebijakan privasi & syarat ketentuan!"
      );
      return; // Tidak lanjut ke setLoading(true)
    }

    // Semua validasi lolos, baru mulai loading
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/register",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "USER",
        }
      );

      toast.success(
        <div>
          <p>Registrasi berhasil! Cek email Anda untuk verifikasi.</p>
          <a
            href="https://mail.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Buka Gmail
          </a>
        </div>,
        { autoClose: 8000 }
      );

      // Simpan email di localStorage untuk verifikasi
      localStorage.setItem("email", formData.email);

      // Reset Form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        agreeToTerms: false,
      });

      // Tunggu sebelum redirect ke login
      setTimeout(() => {
        router.push("/verify-pending");
      }, 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Terjadi Kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 w-full max-w-md bg-white">
      <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-center">
        Register
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Input Nama */}
        <div className="relative">
          <label className="block text-gray-600 mb-2">Nama</label>
          <div className="relative">
            <FaUser className="absolute left-3 top-4 text-gray-400" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Masukkan Nama Lengkap"
              required
              className="border border-gray-300 bg-white p-3 pl-10 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Input Email */}
        <div className="relative">
          <label className="block text-gray-600 mb-2">E-mail</label>
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-4 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukkan E-mail"
              required
              className="border border-gray-300 bg-white p-3 pl-10 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Input Password */}
        <div className="relative">
          <label className="block text-gray-600 mb-2">Password</label>
          <div className="relative">
            <FaLock className="absolute left-3 top-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Masukkan Password"
              required
              title="Gunakan minimal 8 karakter dengan kombinasi huruf besar, angka, dan simbol."
              className="border border-gray-300 bg-white p-3 pl-10 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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

        {/* Input Konfirmasi Password */}
        <div className="relative">
          <label className="block text-gray-600 mb-2">Confirm Password</label>
          <div className="relative">
            <FaLock className="absolute left-3 top-4 text-gray-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Masukkan Konfirmasi Password"
              required
              title="Masukkan Password yang Sama dengan Kolom Diatas"
              className="border border-gray-300 bg-white p-3 pl-10 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              className="absolute right-3 top-4 text-gray-600 hover:text-gray-800"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
        </div>

        {/* Checkbox Kebijakan Privasi */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="terms"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="w-4 h-4"
          />
          <label htmlFor="terms" className="text-sm text-gray-600">
            Saya setuju dengan{" "}
            <a href="/terms" className="text-blue-500 hover:underline">
              Kebijakan Privasi
            </a>{" "}
            &{" "}
            <a href="/terms" className="text-blue-500 hover:underline">
              Syarat Ketentuan
            </a>
          </label>
        </div>

        {/* Tombol Submit dengan Loading Spinner */}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 px-4 w-full rounded-md transition duration-300 flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 1010 10h-4l3 3 3-3h-4a8 8 0 01-8 8z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            "Register"
          )}
        </button>
      </form>

      <p className="text-gray-600 text-sm text-center mt-4">
        Sudah punya akun?{" "}
        <a href="/login" className="text-blue-500 hover:underline hover:text-blue-700 transition">
          Login di sini
        </a>
      </p>
    </div>
  );
};

export default RegisterForm;
