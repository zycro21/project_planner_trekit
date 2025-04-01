"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { Particles } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, Engine } from "@tsparticles/engine";

export default function Destinations() {
  const [showSun, setShowSun] = useState(false);
  const [engineLoaded, setEngineLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowSun(true), 1000);
  }, []);

  // Fungsi inisialisasi tsParticles
  const particlesInit = async (engine: Engine) => {
    await loadSlim(engine); // Load versi slim untuk performa lebih baik
    setEngineLoaded(true);
  };

  // Callback ketika partikel telah dimuat
  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log("Particles Loaded:", container);
  };

  return (
    <div className="relative bg-white overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section
        className="mt-0 mb-40 relative h-[80vh] flex items-center justify-center text-center bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: "url('/images/travel-1.jpg')" }}
      >
        {/* Efek Kilatan Cahaya */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-slow"></div>

        {/* Efek Partikel Cahaya */}
        {engineLoaded && (
          <Particles
            id="tsparticles"
            particlesLoaded={particlesLoaded}
            options={{
              background: {
                color: "transparent",
              },
              fpsLimit: 120,
              interactivity: {
                events: {
                  onClick: { enable: true, mode: "push" },
                  onHover: { enable: true, mode: "repulse" },
                  resize: {
                    enable: true,
                  },
                },
                modes: {
                  push: { quantity: 4 },
                  repulse: { distance: 200, duration: 0.4 },
                },
              },
              particles: {
                color: { value: "#ffffff" },
                links: {
                  color: "#ffffff",
                  distance: 150,
                  enable: true,
                  opacity: 0.5,
                  width: 1,
                },
                move: {
                  direction: "none",
                  enable: true,
                  outModes: { default: "bounce" },
                  random: false,
                  speed: 1.2,
                  straight: false,
                },
                number: {
                  density: {
                    enable: true, // Enable density
                  },
                  value: 40, // Jumlah partikel
                },
                opacity: { value: 0.7 },
                shape: { type: "circle" },
                size: { value: { min: 2, max: 4 } },
              },
              detectRetina: true,
            }}
            className="absolute inset-0"
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl font-bold text-white drop-shadow-lg animate-glow">
            Explore Breathtaking Destinations
          </h1>
          <p className="text-lg text-gray-200 mt-3">
            Discover the best travel experiences around the world.
          </p>
        </motion.div>
      </section>

      {/* Popular Destinations */}
      <section className="my-20 bg-blue-50 py-16 relative overflow-hidden">
        <div className="container mx-auto max-w-screen-lg text-center">
          <h2 className="text-3xl font-bold text-blue-900">
            Popular Destinations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 relative z-10">
            {["Bali", "Paris", "Tokyo", "New York"].map((city, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all relative"
                whileHover={{ scale: 1.05 }}
              >
                {/* Efek Matahari Terbit di destinasi pertama */}
                {index === 0 && showSun && (
                  <motion.div
                    className="absolute top-0 left-0 w-20 h-20 bg-yellow-400 rounded-full opacity-80"
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                  />
                )}

                <Image
                  src={`/images/${city.toLowerCase()}.jpg`}
                  alt={city}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-blue-800">
                    {city}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="my-20 py-16 bg-blue-900 text-white relative">
        <div className="container mx-auto max-w-screen-lg text-center">
          <h2 className="text-3xl font-bold animate-glow">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {[
              {
                title: "Best Prices",
                desc: "Affordable travel options for everyone.",
              },
              {
                title: "Expert Guides",
                desc: "Local experts to enhance your experience.",
              },
              { title: "24/7 Support", desc: "Always here to help you." },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="p-6 bg-white rounded-lg shadow-md text-gray-900 relative"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <h3 className="text-xl font-semibold text-blue-800">
                  {item.title}
                </h3>
                <p className="mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="my-20 bg-gray-100 py-16 relative">
        <div className="container mx-auto max-w-screen-lg text-center">
          <h2 className="text-3xl font-bold text-blue-900">
            What Our Travelers Say
          </h2>

          {/* Efek Bintang Berkilau */}
          {engineLoaded && (
            <Particles
              id="tsparticles-stars"
              particlesLoaded={particlesLoaded}
              options={{
                particles: {
                  number: { value: 30 },
                  size: { value: 1 },
                  move: {
                    enable: true,
                    speed: 0.5,
                  },
                  opacity: { value: 0.9 },
                  shape: { type: "star" },
                  color: { value: "#ffd700" },
                },
              }}
              className="absolute inset-0"
            />
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
