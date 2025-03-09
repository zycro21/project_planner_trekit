import RegisterForm from "./RegisterForm";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-gray-300 via-blue-200 to-gray-300">
      <div className="flex w-full max-w-md md:max-w-4xl rounded-lg overflow-hidden shadow-lg flex-col md:flex-row">
        {/* Bagian Kiri (Form Register) */}
        <div className="w-full md:w-1/2 p-4 md:p-8 flex flex-col justify-center bg-white">
          <RegisterForm />
        </div>

        {/* Bagian Kanan (Gambar & Teks) → Hilang di Mobile */}
        <div className="hidden md:flex w-1/2 relative flex-col items-center pr-6 bg-white">
          {/* Gambar */}
          <div className="relative w-full h-4/5 overflow-hidden">
            <Image
              src="/images/background1.jpg"
              alt="Background"
              fill
              sizes="100vw"
              style={{ objectFit: "cover" }}
              className="scale-110 transition-transform duration-500 ease-in-out hover:scale-125 hover:opacity-80"
            />
          </div>

          {/* Teks */}
          <div className="w-full h-2/5 flex flex-col items-center justify-start text-center px-6">
            <h2 className="text-3xl font-bold text-blue-500 transition duration-300 ease-in-out hover:text-blue-700 hover:scale-105">
              Every new friend is a new adventure.
            </h2>
            <p className="mt-2 text-lg text-gray-600 transition duration-300 ease-in-out hover:text-gray-800 hover:scale-105">
              Let's get connected!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
