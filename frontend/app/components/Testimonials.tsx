import { motion } from "framer-motion";
import { FaUserCircle } from "react-icons/fa";

const testimonials = [
  { name: "Alice", text: "This platform made my travel planning so easy!" },
  { name: "John", text: "A seamless experience from start to finish!" },
  { name: "Sophia", text: "Best travel platform I've ever used!" },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-blue-50 to-white text-center">
      <motion.h2
        className="text-3xl font-bold text-blue-800"
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        What Our Users Say
      </motion.h2>

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            className="p-6 bg-white rounded-xl shadow-lg flex flex-col items-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: index * 0.2 }}
          >
            <motion.div
              className="text-blue-600 text-6xl mb-4"
              animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, -5, 5, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <FaUserCircle />
            </motion.div>
            <p className="text-lg italic text-gray-700">"{testimonial.text}"</p>
            <h3 className="mt-4 text-lg font-semibold text-blue-900">
              {testimonial.name}
            </h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
