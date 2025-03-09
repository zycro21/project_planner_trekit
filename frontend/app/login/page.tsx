import LoginForm from "./LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-gray-300 via-blue-200 to-gray-300">
      <div className="flex w-full max-w-md md:max-w-4xl rounded-lg overflow-hidden shadow-lg flex-col md:flex-row">
        {/* Bagian Kiri (Form Login) */}
        <div className="w-full md:w-1/2 p-4 md:p-8 flex flex-col justify-center bg-white">
          <LoginForm />
        </div>

        {/* Bagian Kanan (Gambar & Teks) → Hilang di Mobile */}
        <div className="hidden md:flex w-1/2 flex-col items-center justify-center bg-white p-6 gap-4">
          {/* Gambar */}
          <div className="relative w-60 h-60 transition-transform duration-300 hover:scale-110 hover:opacity-80">
            <Image
              src="/images/background1.jpg"
              alt="Background"
              fill
              className="object-contain"
            />
          </div>

          {/* Teks */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-blue-500 hover:text-blue-700 transition">
              Welcome Back!
            </h2>
            <p className="mt-2 text-gray-600">
              Login untuk melanjutkan petualangan Anda!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
