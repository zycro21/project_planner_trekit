import { motion } from "framer-motion";
import Image from "next/image";

const destinations = [
  { name: "Paris", image: "/images/paris.jpg" },
  { name: "Bali", image: "/images/bali.jpg" },
  { name: "Kyoto", image: "/images/kyoto.jpg" },
];

const PopularDestinations = () => {
  return (
    <section className="py-20 bg-gray-100 text-center">
      {/* Judul */}
      <h2 className="text-4xl font-bold text-blue-800 tracking-wide mb-6">
        Popular Destinations
      </h2>
      <p className="text-gray-600 text-lg mb-10">
        Explore the world's most breathtaking places
      </p>

      {/* Grid Destinasi */}
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {destinations.map((dest, index) => (
          <motion.div
            key={index}
            className="p-6 bg-white rounded-xl shadow-lg relative overflow-hidden group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: index * 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Efek Gradasi */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100"></div>

            {/* Gambar Destinasi */}
            <Image
              src={dest.image}
              alt={dest.name}
              width={400}
              height={250}
              className="rounded-xl transition-transform duration-500 group-hover:scale-110"
            />

            {/* Nama Destinasi */}
            <h3 className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white text-2xl font-semibold shadow-md transition-all duration-500 group-hover:bottom-10">
              {dest.name}
            </h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default PopularDestinations;
