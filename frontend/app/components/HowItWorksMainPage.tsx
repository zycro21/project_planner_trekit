import { motion } from "framer-motion";
import { FaClipboardList, FaCalendarCheck, FaPlane } from "react-icons/fa";

const steps = [
  {
    title: "Plan",
    description: "Organize your itinerary easily.",
    icon: <FaClipboardList />,
  },
  {
    title: "Book",
    description: "Secure your reservations hassle-free.",
    icon: <FaCalendarCheck />,
  },
  {
    title: "Enjoy",
    description: "Experience the adventure!",
    icon: <FaPlane />,
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-blue-50 text-center">
      <motion.h2
        className="text-3xl font-bold text-blue-800"
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        How It Works
      </motion.h2>

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            className="p-8 bg-white rounded-xl shadow-lg flex flex-col items-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
          >
            <motion.div
              className="text-blue-600 text-5xl mb-4"
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {step.icon}
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-800">
              {step.title}
            </h3>
            <p className="mt-2 text-gray-600">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
