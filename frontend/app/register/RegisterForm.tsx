"use client";

import React, { useState } from "react";
import axios from "axios";

const RegisterForm  = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorConfirmPass, setErrorConfirmPass] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorConfirmPass("");

    // Validate Confirm Password
    if (formData.password !== formData.confirmPassword) {
      setErrorConfirmPass("Konfirmasi Password Tidak Sesuai");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "USER",
      });

      setMessage(response.data.message);
      setFormData({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Terjadi Kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Register</h2>

        {message && <p className="text-sm text-red-500 mb-4">{message}</p>}
        {errorConfirmPass && (
          <p className="text-sm text-red-500 mb-4">{errorConfirmPass}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Nama:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Confirm Password:</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 w-full rounded-md transition"
          >
            {loading ? "Processed..." : "Register"}
          </button>
        </form>
      </div>
    </>
  );
}

export default RegisterForm;