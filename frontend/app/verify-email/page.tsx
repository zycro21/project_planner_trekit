"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

const VerifyEmailPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token tidak ditemukan.");
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/api/users/verify-email/${token}`
        );

        setStatus("success");
        setMessage(response.data.message);

        // Redirect ke login setelah 3 detik
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error.response?.data?.message || "Terjadi kesalahan saat verifikasi."
        );
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white px-4">
      <div className="text-center max-w-lg">
        {status === "loading" ? (
          <p className="text-blue-500 text-lg font-semibold">
            Verifikasi sedang diproses...
          </p>
        ) : status === "success" ? (
          <>
            <h2 className="text-2xl font-bold text-green-600">
              Verifikasi Berhasil!
            </h2>
            <p className="text-gray-700 mt-2">{message}</p>
            <p className="text-gray-500 text-sm mt-2">
              Anda akan dialihkan ke halaman login dalam 3 detik...
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-red-600">
              Verifikasi Gagal!
            </h2>
            <p className="text-gray-700 mt-2">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
