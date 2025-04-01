import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaPlaneDeparture, FaMapMarkedAlt, FaCompass } from "react-icons/fa";

type Particle = {
  id: number;
  size: number;
  top: number;
  left: number;
  duration: number;
};

const CallToAction = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generatedParticles: Particle[] = [...Array(10)].map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: Math.random() * 2 + 2,
    }));
    setParticles(generatedParticles);
  }, []);

  return (
    <section className="relative py-20 bg-gradient-to-br from-blue-800 to-blue-500 text-white text-center overflow-hidden">
      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute bg-white rounded-full opacity-50"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              top: `${p.top}%`,
              left: `${p.left}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Icon Header dengan Hover Animasi */}
      <motion.div
        className="text-5xl text-yellow-300 flex justify-center gap-6 mb-4"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
      >
        {[FaMapMarkedAlt, FaPlaneDeparture, FaCompass].map((Icon, index) => (
          <motion.div
            key={index}
            whileHover={{
              scale: 1.2,
              rotate: 10,
              y: -5,
              transition: { duration: 0.3, ease: "easeOut" },
            }}
          >
            <Icon />
          </motion.div>
        ))}
      </motion.div>

      {/* Title dengan Hover Animasi */}
      <motion.h2
        className="text-4xl font-bold cursor-pointer"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        whileHover={{
          scale: 1.1,
          color: "#FFD700", // Warna emas saat hover
          transition: { duration: 0.3, ease: "easeOut" },
        }}
      >
        Ready to Explore?
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        className="mt-4 text-lg"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        Start planning your dream trip today.
      </motion.p>

      {/* Animated Button */}
      <motion.button
        className="mt-8 px-8 py-4 bg-yellow-400 text-blue-900 font-semibold rounded-lg shadow-lg hover:bg-yellow-300 transition-all duration-300"
        whileHover={{ scale: 1.1, rotate: -3 }}
        whileTap={{ scale: 0.95, rotate: 3 }}
      >
        Get Started
      </motion.button>
    </section>
  );
};

export default CallToAction;
