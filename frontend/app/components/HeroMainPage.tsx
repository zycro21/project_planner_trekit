"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

// Array berisi gambar tempat wisata
const images = [
  "/images/travel-1.jpg",
  "/images/travel-2.jpg",
  "/images/travel-3.jpg",
  "/images/travel-4.jpg",
  "/images/travel-5.jpg",
  "/images/travel-6.jpg",
];

export default function Hero() {
  const [currentImage, setCurrentImage] = useState(0);

  // Auto-slide setiap 4 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="h-screen flex flex-col items-center justify-center text-center text-blue-900 z-0">
      {/* Background Image Slider */}
      <div className="absolute inset-0 max-w-full h-full -z-10 overflow-hidden">
        <motion.div
          key={currentImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="max-w-full h-full" // Tambahkan ini
        >
          <Image
            src={images[currentImage]}
            alt="Travel Background"
            width={1920} // Atur ukuran sesuai kebutuhan
            height={1080}
            priority
            unoptimized
            className="object-cover opacity-50 max-w-[100vw] h-[100vh]" 
          />
        </motion.div>
      </div>

      {/* Title & Subtitle */}
      <motion.h1
        className="relative text-6xl md:text-7xl font-extrabold z-50"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      >
        Discover Your Next Adventure
      </motion.h1>
      <motion.p
        className="relative mt-4 text-xl md:text-2xl font-medium z-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: "easeInOut" }}
      >
        Plan, book, and explore the world with ease.
      </motion.p>

      {/* Call to Action Button */}
      <motion.div
        className="relative mt-6 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6, ease: "easeInOut" }}
      >
        <Link href="/destinations">
          <button className="px-8 py-4 text-lg bg-white text-black font-semibold rounded-lg shadow-lg hover:bg-gray-200 transition-all">
            Get Started
          </button>
        </Link>
      </motion.div>
    </section>
  );
}
