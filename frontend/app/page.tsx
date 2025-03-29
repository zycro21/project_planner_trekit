"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Hero from "./components/HeroMainPage";

export default function Home() {
  return (
    <div className="bg-white text-gray-900">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Popular Destinations */}
      <section className="py-20 bg-gray-100 text-center">
        <h2 className="text-3xl font-bold text-gray-800">
          Popular Destinations
        </h2>
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {["Paris", "Bali", "Kyoto"].map((dest, index) => (
            <motion.div
              key={index}
              className="p-6 bg-white rounded-lg shadow-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <Image
                src={`/images/${dest.toLowerCase()}.jpg`}
                alt={dest}
                width={300}
                height={200}
                className="rounded-lg"
              />
              <h3 className="mt-4 text-xl font-semibold">{dest}</h3>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-blue-50 text-center">
        <h2 className="text-3xl font-bold text-blue-800">How It Works</h2>
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {["Plan", "Book", "Enjoy"].map((step, index) => (
            <motion.div
              key={index}
              className="p-6 bg-white rounded-lg shadow-md"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <h3 className="text-xl font-semibold">{step}</h3>
              <p className="mt-2 text-gray-600">
                Step {index + 1} description here.
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white text-center">
        <h2 className="text-3xl font-bold text-gray-800">What Our Users Say</h2>
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {["Alice", "John"].map((name, index) => (
            <motion.div
              key={index}
              className="p-6 bg-gray-100 rounded-lg shadow-md"
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: index * 0.3 }}
            >
              <p className="text-lg italic">
                "This platform made my travel planning so easy!"
              </p>
              <h3 className="mt-4 text-lg font-semibold">{name}</h3>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-600 text-white text-center">
        <h2 className="text-3xl font-bold">Ready to Explore?</h2>
        <p className="mt-4 text-lg">Start planning your dream trip today.</p>
        <motion.button
          className="mt-6 px-6 py-3 bg-white text-blue-700 font-semibold rounded-md shadow-md hover:bg-gray-200"
          whileHover={{ scale: 1.1 }}
        >
          Get Started
        </motion.button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white text-center py-6">
        <p>
          &copy; {new Date().getFullYear()} TravelItinerary. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
