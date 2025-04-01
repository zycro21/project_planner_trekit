"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Hero from "./components/HeroMainPage";
import PopularDestinations from "./components/PopularMainPage";
import HowItWorks from "./components/HowItWorksMainPage";
import Testimonials from "./components/Testimonials";
import CallToAction from "./components/CTAMainPage";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="bg-white text-gray-900">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Popular Destinations */}
      <PopularDestinations />

      {/* How It Works */}
      <HowItWorks />

      {/* Testimonials */}
      <Testimonials />

      {/* Call to Action */}
      <CallToAction />

      {/* Footer */}
      <Footer />
    </div>
  );
}
