import { motion } from "framer-motion";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-black text-gray-300 py-12">
      <div className="container mx-auto px-6 md:px-12">
        {/* Grid Footer */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Company */}
          <div>
            <h4 className="text-xl font-semibold text-white">Company</h4>
            <ul className="mt-4 space-y-2">
              {["About Us", "Blog", "Careers", "Contact"].map((item, index) => (
                <motion.li
                  key={index}
                  whileHover={{ scale: 1.1, x: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <a href="#" className="hover:text-yellow-400 transition">
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xl font-semibold text-white">Support</h4>
            <ul className="mt-4 space-y-2">
              {["FAQ", "Help Center", "Guides"].map((item, index) => (
                <motion.li
                  key={index}
                  whileHover={{ scale: 1.1, x: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <a href="#" className="hover:text-yellow-400 transition">
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xl font-semibold text-white">Legal</h4>
            <ul className="mt-4 space-y-2">
              {["Privacy Policy", "Terms & Conditions"].map((item, index) => (
                <motion.li
                  key={index}
                  whileHover={{ scale: 1.1, x: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <a href="#" className="hover:text-yellow-400 transition">
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Social Media */}
          <div className="text-center md:text-left">
            <h4 className="text-xl font-semibold text-white">Follow Us</h4>
            <div className="mt-4 flex justify-center md:justify-start space-x-4">
              {[
                { icon: FaFacebookF, link: "#" },
                { icon: FaInstagram, link: "#" },
                { icon: FaTwitter, link: "#" },
                { icon: FaYoutube, link: "#" },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.link}
                  className="p-3 bg-gray-800 rounded-full hover:bg-yellow-400 hover:text-black transition"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <social.icon size={20} />
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Garis Pemisah */}
        <div className="border-t border-gray-600 mt-10 pt-6 text-center">
          <p>
            &copy; {new Date().getFullYear()} TravelItinerary. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
