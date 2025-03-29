"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaUser, FaSignInAlt, FaUserPlus } from "react-icons/fa";
import { IoMdMenu, IoMdClose } from "react-icons/io";

export default function Navbar() {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.nav
      className="bg-blue-900 text-white py-5 fixed w-full shadow-lg z-50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="container mx-auto flex items-center justify-between px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logonavbar.png"
            alt="Logo"
            width={50}
            height={50}
            className="bg-white p-1 rounded-md shadow-md"
          />
          <h1 className="text-3xl font-bold tracking-wide">TravelItinerary</h1>
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-8 text-lg font-medium">
          {["Home", "Destinations", "Itineraries", "About", "Contact"].map(
            (item, index) => (
              <motion.li
                key={index}
                className="relative group cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                <Link
                  href={`/${item.toLowerCase()}`}
                  className="hover:text-blue-300"
                >
                  {item}
                </Link>
                {/* Animasi underline */}
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-300 transition-all duration-300 group-hover:w-full"></span>
              </motion.li>
            )
          )}
        </ul>

        {/* Icon User dengan Dropdown */}
        <div className="relative">
          <FaUser
            className="text-2xl cursor-pointer hover:text-blue-300 transition-all duration-300"
            onClick={() => setDropdownOpen(!isDropdownOpen)}
          />
          {isDropdownOpen && (
            <motion.div
              className="absolute right-0 mt-4 bg-white text-gray-900 rounded-lg shadow-xl overflow-hidden w-48"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                background: "linear-gradient(135deg, #ffffff, #f9f9f9)",
              }}
            >
              <Link
                href="/register"
                className="flex items-center gap-3 px-4 py-3 text-lg hover:bg-gray-100 transition-all duration-200"
                onClick={() => setDropdownOpen(false)}
              >
                <FaUserPlus className="text-blue-500" /> Register
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-3 px-4 py-3 text-lg hover:bg-gray-100 transition-all duration-200"
                onClick={() => setDropdownOpen(false)}
              >
                <FaSignInAlt className="text-green-500" /> Login
              </Link>
            </motion.div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-2xl focus:outline-none transition-all duration-300"
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <IoMdClose /> : <IoMdMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          className="md:hidden absolute top-full left-0 w-full bg-blue-900 shadow-md"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ul className="flex flex-col text-center py-6 space-y-6">
            {["Home", "Destinations", "Itineraries", "About", "Contact"].map(
              (item, index) => (
                <li key={index}>
                  <Link
                    href={`/${item.toLowerCase()}`}
                    className="text-lg hover:text-blue-300 transition-all duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </Link>
                </li>
              )
            )}
          </ul>
        </motion.div>
      )}
    </motion.nav>
  );
}
