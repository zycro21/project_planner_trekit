"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaUser,
  FaMapMarkerAlt,
  FaClipboardList,
  FaStar,
  FaHeart,
  FaSignOutAlt,
  FaHome,
  FaBars,
} from "react-icons/fa";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter(); // Untuk navigasi setelah logout

  const menuItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: <FaHome /> },
    { name: "Users", href: "/admin/user", icon: <FaUser /> },
    {
      name: "Destinations",
      href: "/admin/destination",
      icon: <FaMapMarkerAlt />,
    },
    { name: "Itinerary", href: "/admin/itinerary", icon: <FaClipboardList /> },
    { name: "Reviews", href: "/admin/review", icon: <FaStar /> },
    { name: "Wishlist", href: "/admin/wishlist", icon: <FaHeart /> },
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/users/logout", {
        method: "POST",
        credentials: "include", // Penting agar cookie dikirim
      });

      if (response.ok) {
        router.push("/login"); // Redirect ke halaman login
      } else {
        console.error("Logout gagal");
      }
    } catch (error) {
      console.error("Terjadi kesalahan saat logout:", error);
    }
  };

  return (
    <div
      className={`h-screen flex flex-col bg-blue-900 text-white transition-all duration-300 ${
        isOpen ? "w-64" : "w-24"
      }`}
    >
      {/* Toggle Button */}
      <div
        className={`p-4 flex ${
          isOpen ? "justify-center" : "justify-center"
        } items-center`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white text-2xl"
        >
          <FaBars />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center gap-3 p-3 rounded-md transition-all duration-300
        ${
          pathname === item.href
            ? "bg-blue-600 text-white"
            : "hover:bg-blue-700"
        }
        ${isOpen ? "justify-start" : "justify-center"}
      `}
          >
            {/* Ikon dengan Efek Hover */}
            <span className="text-xl transition-all duration-300 group-hover:text-fuchsia-400 group-hover:scale-110">
              {item.icon}
            </span>

            {/* Teks hanya muncul saat sidebar terbuka */}
            {isOpen && (
              <span className="transition-all duration-300 group-hover:tracking-wide">
                {item.name}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 mt-auto">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 bg-red-600 p-3 rounded-md hover:bg-red-700
      ${isOpen ? "w-full" : "w-12 justify-center"}`}
        >
          <FaSignOutAlt className={`${isOpen ? "text-xl" : "text-3xl"}`} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
