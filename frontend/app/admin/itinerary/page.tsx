"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSortDown,
  FaSortUp,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Itinerary {
  itinerary_id: string;
  user_id?: string;
  title?: string;
  description?: string;
  start_date: string | Date; // Tanpa `undefined`
  end_date: string | Date;
  is_public?: boolean;
  created_at?: string | Date; // Timestamp dari DB
  itinerary_destinations?: ItineraryDestination[]; // Relasi ke destinasi
}

interface ItineraryDestination {
  id: string;
  itinerary_id?: string;
  destination_id?: string;
  day?: number;
  order_index?: number;
  destination?: Destination;
  itinerary?: Itinerary;
}

interface Destination {
  destination_id: string;
  name: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  images?: DestinationImage[];
  itinerary_destinations?: ItineraryDestination[];
  reviews?: Review[];
  wishlist_destinations?: WishlistDestination[];
}

interface DestinationImage {
  image_id: string;
  image_url: string;
}

interface ItineraryDestination {
  id: string;
  detail: string;
}

interface Review {
  id: string;
  comment: string;
}

interface WishlistDestination {
  id: string;
  user_id: string;
}

export default function ItineraryPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchBy, setSearchBy] = useState<"title" | "description">("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"start_date" | "end_date">(
    "start_date"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // State untuk Create
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [isModalDestinationsOpen, setIsModalDestinationsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [sortFieldDestination, setSortFieldDestination] = useState<
    string | null
  >(null);
  const [sortOrderDestination, setSortOrderDestination] = useState<
    "ASC" | "DESC" | null
  >(null);
  const [currentPageDestination, setCurrentPageDestination] = useState(1);
  const [totalPagesDestination, setTotalPagesDestination] = useState(1);
  const limitDestination = 10;
  const [selectedDestinations, setSelectedDestinations] = useState<
    { destination_id: string; day?: number; order_index?: number }[]
  >([]);
  const [formCreateItinerary, setFormCreateItinerary] = useState({
    user_id: "",
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    is_public: true,
  });

  // State Detail Itinerary
  const [isModalDetailOpen, setIsModalDetailOpen] = useState(false);
  const [selectedDetailItinerary, setSelectedDetailItinerary] =
    useState<Itinerary | null>(null);

  // Modal Controls
  const openModal = () => setIsModalCreateOpen(true);
  const closeModal = () => {
    setIsModalCreateOpen(false);

    // Reset form
    setFormCreateItinerary({
      user_id: "",
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      is_public: true,
    });

    // Reset selected destinations
    setSelectedDestinations([]);
  };
  const openDestinationsModal = () => setIsModalDestinationsOpen(true);
  const closeDestinationsModal = () => setIsModalDestinationsOpen(false);

  const fetchItineraries = async () => {
    setLoading(true);
    try {
      console.log("Fetching itineraries...");
      const response = await axios.get(
        "http://localhost:5000/api/itineraries/itinerary",
        {
          params: {
            search: searchQuery || undefined,
            sortBy: sortField || "start_date",
            sortOrder: sortOrder.toLowerCase(),
            limit: limit || 10,
            page: currentPage || 1,
          },
          withCredentials: true,
        }
      );

      console.log("✅ Response Full Data:", response.data); // Tambahkan log ini

      if (!response.data || !response.data.data) {
        throw new Error("Response data invalid!"); // Tambahkan validasi
      }

      setItineraries(response.data.data);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("Gagal mengambil data itinerary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItineraries();
  }, [searchQuery, sortField, sortOrder, currentPage]);

  const handleSort = (field: "start_date" | "end_date") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const fetchDestinations = async () => {
    try {
      const params: any = {
        sort: sortOrderDestination || "ASC",
        sortField: sortFieldDestination || "name",
        limitDestination,
        offset: (currentPageDestination - 1) * limitDestination,
      };

      const response = await axios.get(
        "http://localhost:5000/api/destinations/destinations",
        {
          params,
          withCredentials: true,
        }
      );

      setDestinations(response.data.data);
      setTotalPagesDestination(response.data.totalPages);
    } catch (err) {
      setError("Gagal mengambil data destinasi");
    } finally {
      setLoading(false);
    }
  };

  const handlePageDestinationChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPagesDestination) {
      setCurrentPageDestination(newPage);
    }
  };

  // Ambil data saat modal dibuka
  useEffect(() => {
    if (isModalDestinationsOpen) {
      fetchDestinations();
    }
  }, [
    isModalDestinationsOpen,
    currentPageDestination,
    sortFieldDestination,
    sortOrderDestination,
  ]);

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormCreateItinerary((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Handle pilih destinasi
  const handleDestinationSelect = (destination_id: string) => {
    setSelectedDestinations((prev) => {
      const isSelected = prev.some(
        (dest) => dest.destination_id === destination_id
      );
      if (isSelected) {
        return prev.filter((dest) => dest.destination_id !== destination_id);
      } else {
        return [...prev, { destination_id }];
      }
    });
  };

  // Handle submit itinerary
  const handleSubmit = async () => {
    const dataToSend = {
      ...formCreateItinerary,
      destinations: selectedDestinations,
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/api/itineraries/itinerary",
        dataToSend,
        {
          withCredentials: true,
        }
      );

      toast.success("Itinerary berhasil dibuat!", {
        position: "top-right",
        autoClose: 3000,
      });
      fetchItineraries();
      closeModal();
    } catch (error) {
      console.error("Gagal membuat itinerary:", error);
      toast.error("Gagal membuat itinerary!", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const openDetailModal = async (id: string) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/itineraries/itinerary/${id}`, {
          withCredentials: true,
        }
      );

      // Pastikan itinerary_destinations tidak undefined
      setSelectedDetailItinerary({
        ...response.data,
        itinerary_destinations: response.data.itinerary_destinations ?? [],
      });

      setIsModalDetailOpen(true);
    } catch (error) {
      console.error("Error fetching itinerary details:", error);
    }
  };

  // Function untuk menutup modal
  const closeDetailModal = () => {
    setIsModalDetailOpen(false);
    setSelectedDetailItinerary(null);
  };

  return (
    <div className="p-6 pt-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Itinerary Management</h1>

        <div className="flex justify-between items-center mb-4 gap-4">
          {/* Dropdown untuk memilih filter pencarian */}
          <select
            value={searchBy}
            onChange={(e) =>
              setSearchBy(e.target.value as "title" | "description")
            }
            className="border p-2 rounded-md"
          >
            <option value="title">Title</option>
            <option value="description">Description</option>
          </select>

          {/* Input Search */}
          <input
            type="text"
            placeholder={`Search by ${searchBy}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 rounded-md w-60"
          />

          {/* Tombol Create Itinerary */}
          <motion.button
            className="flex items-center justify-center bg-blue-600 text-white py-2 px-3 rounded-md transition-all overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ width: "40px" }}
            animate={{ width: isHovered ? "150px" : "40px" }}
            transition={{ duration: 0.3 }}
            onClick={openModal}
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: isHovered ? 0.9 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <FaPlus className="text-xl" />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
              transition={{ duration: 0.2 }}
              className={`ml-2 text-sm ${isHovered ? "block" : "hidden"}`}
            >
              Create Itinerary
            </motion.span>
          </motion.button>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="py-3 px-4 text-left">No</th>
              <th className="py-3 px-4 text-left">Title</th>
              <th className="py-3 px-4 text-left">Description</th>
              {["start_date", "end_date"].map((key) => (
                <th
                  key={key}
                  className="py-3 px-4 text-left cursor-pointer select-none"
                  onClick={() => handleSort(key as "start_date" | "end_date")}
                >
                  <span className="inline-flex items-center gap-1">
                    {key.replace("_", " ").toUpperCase()}
                    {sortField === key &&
                      (sortOrder === "asc" ? <FaSortDown /> : <FaSortUp />)}
                  </span>
                </th>
              ))}
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-red-500">
                  {error}
                </td>
              </tr>
            ) : itineraries.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  Data belum ada
                </td>
              </tr>
            ) : (
              itineraries.map((itinerary, index) => (
                <tr key={itinerary.itinerary_id} className="border-b">
                  <td className="py-3 px-4">
                    {(currentPage - 1) * limit + index + 1}
                  </td>
                  <td className="py-3 px-4">{itinerary.title}</td>
                  <td className="py-3 px-4">{itinerary.description}</td>
                  <td className="py-3 px-4">
                    {new Date(itinerary.start_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {new Date(itinerary.end_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-center flex justify-center gap-2">
                    <button
                      className="bg-blue-100 p-2 rounded"
                      onClick={() => openDetailModal(itinerary.itinerary_id)}
                    >
                      <FaEye />
                    </button>
                    <button className="bg-yellow-100 p-2 rounded">
                      <FaEdit />
                    </button>
                    <button className="bg-red-100 p-2 rounded">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4">
        {/* Tombol Prev */}
        <button
          className={`px-3 py-2 rounded ${
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FaChevronLeft />
        </button>

        {/* Logika Menampilkan Nomor Halaman */}
        {currentPage > 2 && totalPages > 3 && <span className="px-3">...</span>}

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (page) =>
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
          )
          .map((page) => (
            <button
              key={page}
              className={`px-3 py-2 rounded ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}

        {currentPage < totalPages - 1 && totalPages > 3 && (
          <span className="px-3">...</span>
        )}

        {/* Tombol Next */}
        <button
          className={`px-3 py-2 rounded ${
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Modal Create Itinerary */}
      <AnimatePresence>
        {isModalCreateOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white p-6 rounded-lg shadow-lg w-96"
            >
              <h2 className="text-lg font-semibold mb-4">Create Itinerary</h2>

              <input
                type="text"
                name="user_id"
                placeholder="User ID"
                value={formCreateItinerary.user_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded mb-2"
              />

              <input
                type="text"
                name="title"
                placeholder="Title"
                value={formCreateItinerary.title}
                onChange={handleInputChange}
                className="w-full p-2 border rounded mb-2"
              />

              <textarea
                name="description"
                placeholder="Description"
                value={formCreateItinerary.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded mb-2"
              ></textarea>

              <input
                type="date"
                name="start_date"
                value={formCreateItinerary.start_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded mb-2"
              />

              <input
                type="date"
                name="end_date"
                value={formCreateItinerary.end_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded mb-4"
              />

              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={formCreateItinerary.is_public}
                  onChange={handleInputChange}
                />
                Public Itinerary
              </label>

              <button
                className="bg-gray-200 p-2 rounded w-full mb-2 hover:bg-gray-300 transition"
                onClick={openDestinationsModal}
              >
                Add Destination
              </button>

              {selectedDestinations.length > 0 && (
                <ul className="text-sm mb-2">
                  {selectedDestinations.map((dest) => (
                    <li key={dest.destination_id}>✔️ {dest.destination_id}</li>
                  ))}
                </ul>
              )}

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-400 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Destination */}
      {isModalDestinationsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 animate-zoom-in">
            <h2 className="text-lg font-semibold mb-4 text-center">
              Select Destinations
            </h2>

            {/* Destinations List */}
            {destinations.length > 0 ? (
              <ul className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {destinations.map((dest) => (
                  <li key={dest.destination_id} className="mb-2">
                    <label
                      className="flex items-center gap-3 p-2 border rounded cursor-pointer 
                  transition-all hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        onChange={() =>
                          handleDestinationSelect(dest.destination_id)
                        }
                        checked={selectedDestinations.some(
                          (d) => d.destination_id === dest.destination_id
                        )}
                        className="hidden"
                      />
                      <span
                        className={`w-5 h-5 flex items-center justify-center border-2 rounded-md transition-all ${
                          selectedDestinations.some(
                            (d) => d.destination_id === dest.destination_id
                          )
                            ? "bg-blue-600 border-blue-600 text-white scale-105"
                            : "border-gray-400 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className="text-gray-700">
                        {dest.name} ({dest.city}, {dest.country})
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500">
                No destinations available.
              </p>
            )}

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() =>
                  handlePageDestinationChange(currentPageDestination - 1)
                }
                disabled={currentPageDestination === 1}
                className={`px-4 py-2 rounded font-medium transition-all ${
                  currentPageDestination === 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Prev
              </button>

              <span className="text-gray-700 font-semibold">
                Page {currentPageDestination} of {totalPagesDestination}
              </span>

              <button
                onClick={() =>
                  handlePageDestinationChange(currentPageDestination + 1)
                }
                disabled={currentPageDestination === totalPagesDestination}
                className={`px-4 py-2 rounded font-medium transition-all ${
                  currentPageDestination === totalPagesDestination
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Next
              </button>
            </div>

            {/* Confirm Button */}
            <button
              onClick={closeDestinationsModal}
              className="w-full mt-4 bg-blue-600 text-white py-2 rounded font-semibold 
          transition-all hover:bg-blue-700 shadow-md"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Modal Detail Itinerary */}
      {isModalDetailOpen && selectedDetailItinerary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fadeIn">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 transform transition-all duration-300 scale-95">
            <h2 className="text-lg font-semibold mb-4">
              {selectedDetailItinerary.title}
            </h2>
            <p className="text-gray-600">
              {selectedDetailItinerary.description}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {new Date(
                selectedDetailItinerary.start_date
              ).toLocaleDateString()}{" "}
              -{" "}
              {new Date(selectedDetailItinerary.end_date).toLocaleDateString()}
            </p>

            {/* Destinasi */}
            {(selectedDetailItinerary.itinerary_destinations ?? []).length >
            0 ? (
              <ul className="mt-4">
                {(selectedDetailItinerary.itinerary_destinations ?? []).map(
                  (dest) => (
                    <li
                      key={dest.id}
                      className="flex items-center gap-2 p-2 border-b"
                    >
                      <span className="text-blue-600">📍</span>
                      {dest.destination?.name} ({dest.destination?.city},{" "}
                      {dest.destination?.country})
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 mt-4">
                Tidak ada destinasi dalam itinerary ini.
              </p>
            )}

            {/* Tombol Tutup */}
            <button
              onClick={closeDetailModal}
              className="mt-4 w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
