"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
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
  destination_id: string;
  day: number;
  order_index: number;
  destination?: Destination; // Opsional
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
  itinerary_id?: string; // Opsional, bisa digunakan untuk relasi
  destination_id: string; // Wajib ada, referensi ke destinasi
  day: number; // Wajib ada, menentukan hari keberapa dalam itinerary
  order_index: number; // Wajib ada, menentukan urutan dalam itinerary
  destination?: Destination; // Opsional, jika perlu mengambil detail destinasi
  itinerary?: Itinerary; // Opsional, jika perlu mengambil detail itinerary
}

interface Review {
  id: string;
  comment: string;
}

interface WishlistDestination {
  id: string;
  user_id: string;
}

type EditItineraryState = {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  itinerary_destinations: ItineraryDestination[]; // Tambahkan properti ini
};

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
  const DestinationsList = () => {
    const destinationsList =
      selectedDetailItinerary?.itinerary_destinations ?? []; // Pakai properti yang benar

    return destinationsList.length ? (
      <ul className="mt-4">
        {destinationsList.map((dest) => (
          <li key={dest.id} className="flex items-center gap-2 p-2 border-b">
            <span className="text-blue-600">📍</span>
            {dest.destination?.name || "Unknown"} (
            {dest.destination?.city || "Unknown"},{" "}
            {dest.destination?.country || "Unknown"})
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-gray-500 mt-4">
        Tidak ada destinasi dalam itinerary ini.
      </p>
    );
  };

  // State Edit atau Update Itinerary
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [selectedEditItinerary, setSelectedEditItinerary] =
    useState<Itinerary | null>(null);
  const [editItinerary, setEditItinerary] = useState<EditItineraryState>({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    is_public: true,
    itinerary_destinations: [],
  });
  // State untuk destinasi yang tersedia & yang dipilih (bagian edit)
  const [availableEditDestinations, setAvailableEditDestinations] = useState<{
    data: Destination[];
    total: number;
    currentPage: number;
    totalPages: number;
  } | null>(null);
  const [selectedEditDestinations, setSelectedEditDestinations] = useState<
    ItineraryDestination[]
  >([]);
  const [isDestinationEditModalOpen, setIsDestinationEditModalOpen] =
    useState(false);
  const [currentPageEditDestination, setCurrentPageEditDestination] =
    useState(1);
  const [totalPagesEditDestination, setTotalPagesEditDestination] = useState(1);
  const limitEditDestination = 10;

  // State untuk Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteItineraryId, setSelectedDeleteItineraryId] = useState<
    string | null
  >(null);

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
        limit: limitDestination,
        offset: (currentPageDestination - 1) * limitDestination,
      };

      const response = await axios.get(
        "http://localhost:5000/api/destinations/destinations",
        {
          params,
          withCredentials: true,
        }
      );

      if (
        response.data &&
        typeof response.data === "object" &&
        Array.isArray(response.data.data)
      ) {
        setDestinations(response.data.data);
        setTotalPagesDestination(response.data.totalPages);
      } else {
        console.warn(
          "Response data tidak sesuai format yang diharapkan:",
          response.data
        );
        setDestinations([]);
        setTotalPagesDestination(1);
      }
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

  const fetchEditDestinations = async () => {
    try {
      const params: any = {
        sort: sortOrderDestination || "ASC",
        sortField: sortFieldDestination || "name",
        limit: limitEditDestination,
        offset: (currentPageEditDestination - 1) * limitEditDestination,
      };

      const response = await axios.get(
        "http://localhost:5000/api/destinations/destinations",
        {
          params,
          withCredentials: true,
        }
      );

      if (
        response.data &&
        typeof response.data === "object" &&
        Array.isArray(response.data.data)
      ) {
        setAvailableEditDestinations({
          data: response.data.data,
          total: response.data.total ?? 0,
          currentPage: response.data.currentPage ?? 1,
          totalPages: response.data.totalPages ?? 1,
        });
      } else {
        console.warn(
          "response.data bukan objek yang diharapkan:",
          response.data
        );
        setAvailableEditDestinations({
          data: [],
          total: 0,
          currentPage: 1,
          totalPages: 1,
        });
      }

      setTotalPagesEditDestination(response.data.totalPages);
    } catch (err) {
      setError("Gagal mengambil data destinasi untuk edit");
    } finally {
      setLoading(false);
    }
  };

  const handlePageEditDestinationChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPagesEditDestination) {
      setCurrentPageEditDestination(newPage);
    }
  };

  // Fetch destinasi untuk modal edit
  useEffect(() => {
    if (isDestinationEditModalOpen) {
      fetchEditDestinations();
    }
  }, [
    isDestinationEditModalOpen,
    currentPageEditDestination,
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
        `http://localhost:5000/api/itineraries/itinerary/${id}`,
        {
          withCredentials: true,
        }
      );

      console.log("API Response:", response.data);

      // Pastikan itinerary_destinations tidak undefined
      setSelectedDetailItinerary({
        ...response.data,
        itinerary_destinations: response.data.destinations ?? [],
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

  const openEditItineraryModal = async (itinerary: Itinerary) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/itineraries/itinerary/${itinerary.itinerary_id}`,
        { withCredentials: true }
      );
      const fullItinerary = response.data;

      console.log("🔹 Full itinerary response:", fullItinerary);
      console.log("🔹 Destinations:", fullItinerary.destinations);

      // Simpan data itinerary yang diambil
      setSelectedEditItinerary(fullItinerary);

      // Periksa apakah fullItinerary.destinations ada dan merupakan array
      const destinations = Array.isArray(fullItinerary.destinations)
        ? fullItinerary.destinations.map((dest: any, index: number) => ({
            id: dest.id || "",
            destination_id:
              dest.destination_id || dest.destination?.destination_id || "", // ✅ Fix: Ambil langsung dari `dest.destination_id`
            day: dest.day || 1,
            order_index: index + 1,
          }))
        : [];

      console.log("🔹 Destinasi yang akan di-set:", destinations);

      setEditItinerary({
        title: fullItinerary.title || "",
        description: fullItinerary.description || "",
        start_date: fullItinerary.start_date
          ? new Date(fullItinerary.start_date).toISOString().split("T")[0]
          : "",
        end_date: fullItinerary.end_date
          ? new Date(fullItinerary.end_date).toISOString().split("T")[0]
          : "",
        is_public: fullItinerary.is_public ?? true,
        itinerary_destinations: destinations, // ✅ Fix: Pastikan format benar
      });

      // Simpan destinasi yang sudah ada di itinerary ke dalam state
      setSelectedEditDestinations(destinations);

      // Fetch semua destinasi yang tersedia
      const destinationsRes = await axios.get(
        "http://localhost:5000/api/destinations/destinations",
        { withCredentials: true }
      );

      console.log("🔹 All available destinations:", destinationsRes.data);

      setAvailableEditDestinations(destinationsRes.data);

      setIsModalEditOpen(true);
    } catch (error) {
      console.error("❌ Gagal mengambil detail itinerary:", error);
    }
  };

  // 🔹 Handle perubahan input form edit itinerary
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" && e.target instanceof HTMLInputElement
        ? e.target.checked
        : value;

    setEditItinerary((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  // 🔹 Handle pemilihan destinasi dalam form edit itinerary (menumpuk sebelum submit)
  const handleSelectEditDestination = (
    e: React.ChangeEvent<HTMLInputElement>,
    destination: Destination
  ) => {
    setSelectedEditDestinations((prev) => {
      const isExist = prev.some(
        (d) => d.destination_id === destination.destination_id
      );

      if (e.target.checked) {
        return isExist
          ? prev
          : [
              ...prev,
              {
                id: "",
                destination_id: destination.destination_id,
                day: 1,
                detail: "",
                order_index: prev.length + 1,
              },
            ];
      } else {
        return prev
          .filter((d) => d.destination_id !== destination.destination_id)
          .map((d, index) => ({
            ...d,
            order_index: index + 1, // Perbaiki urutan setelah penghapusan
          }));
      }
    });
  };

  // 🔹 Handle konfirmasi destinasi yang dipilih dalam modal edit itinerary
  const handleAddEditDestination = () => {
    setEditItinerary({
      ...editItinerary,
      itinerary_destinations: selectedEditDestinations,
    });
    setIsDestinationEditModalOpen(false); // Tutup modal setelah konfirmasi
  };

  // 🔹 Handle perubahan hari destinasi dalam form edit itinerary
  const handleChangeEditDestinationDay = (
    destinationId: string,
    newDay: number | undefined
  ) => {
    setSelectedEditDestinations((prev) =>
      prev.map((d) =>
        d.destination_id === destinationId ? { ...d, day: newDay ?? 1 } : d
      )
    );
  };

  // 🔹 Submit form edit itinerary (mengirim ke backend sekaligus)
  const handleSubmitEditItinerary = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEditItinerary) return;

    // Hapus duplikat sebelum mengirim ke backend
    const uniqueDestinations = selectedEditDestinations.filter(
      (v, i, a) =>
        a.findIndex((t) => t.destination_id === v.destination_id) === i
    );

    const updatedItinerary = {
      ...editItinerary,
      destinations: uniqueDestinations.map((d) => ({
        destination_id: d.destination_id,
        day: d.day,
        order_index: d.order_index,
      })),
    };

    console.log("🔹 Mengirim data ke backend:", updatedItinerary);

    try {
      await axios.put(
        `http://localhost:5000/api/itineraries/itinerary/${selectedEditItinerary.itinerary_id}`,
        updatedItinerary,
        { withCredentials: true }
      );

      toast.success("Itinerary berhasil diperbarui!", {
        position: "top-right",
        autoClose: 3000,
      });

      setIsModalEditOpen(false);
      fetchItineraries(); // Refresh data setelah update
    } catch (error) {
      console.error("❌ Gagal update itinerary:", error);
    }
  };

  const openDeleteModal = (itineraryId: string) => {
    setSelectedDeleteItineraryId(itineraryId);
    setIsDeleteModalOpen(true);
  };

  const deleteItinerary = async () => {
    if (!selectedDeleteItineraryId) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/itineraries/itinerary/${selectedDeleteItineraryId}`,
        {
          withCredentials: true,
        }
      );

      toast.success("Itinerary berhasil dihapus");

      // Perbarui daftar itinerary
      setItineraries((prev) =>
        prev.filter(
          (itinerary) => itinerary.itinerary_id !== selectedDeleteItineraryId
        )
      );

      fetchItineraries();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("❌ Gagal menghapus itinerary:", error);
      toast.error("Gagal menghapus itinerary");
    }
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
                    <button
                      className="bg-yellow-100 p-2 rounded"
                      onClick={() => openEditItineraryModal(itinerary)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="bg-red-100 p-2 rounded"
                      onClick={() => openDeleteModal(itinerary.itinerary_id)}
                    >
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

            <DestinationsList />

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

      {isModalEditOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Edit Itinerary</h2>

            <form onSubmit={handleSubmitEditItinerary} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input
                  type="text"
                  name="title"
                  value={editItinerary.title}
                  onChange={handleEditInputChange}
                  className="w-full border rounded p-2"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  value={editItinerary.description}
                  onChange={handleEditInputChange}
                  className="w-full border rounded p-2"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={editItinerary.start_date}
                  onChange={handleEditInputChange}
                  className="w-full border rounded p-2"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium">End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={editItinerary.end_date}
                  onChange={handleEditInputChange}
                  className="w-full border rounded p-2"
                />
              </div>

              {/* Public Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={editItinerary.is_public}
                  onChange={handleEditInputChange}
                  className="w-4 h-4"
                />
                <label className="text-sm">Public</label>
              </div>

              {/* List of selected destinations */}
              <div className="mt-4">
                {(() => {
                  console.log(
                    "🔹 availableEditDestinations:",
                    availableEditDestinations
                  );
                  console.log(
                    "🔹 Is availableEditDestinations an array?",
                    Array.isArray(availableEditDestinations?.data)
                  );
                  return null;
                })()}

                {editItinerary?.itinerary_destinations &&
                editItinerary.itinerary_destinations.length > 0 ? (
                  <ul className="border rounded p-2">
                    {editItinerary.itinerary_destinations.map(
                      (itineraryDest) => {
                        console.log("🔹 Destination in map():", itineraryDest);
                        console.log(
                          "🔹 Destination ID:",
                          itineraryDest.destination_id
                        );

                        // Pastikan availableEditDestinations.data adalah array
                        const availableDestinations = Array.isArray(
                          availableEditDestinations
                        )
                          ? availableEditDestinations
                          : availableEditDestinations?.data;

                        // Periksa apakah availableDestinations berisi array
                        if (!Array.isArray(availableDestinations)) {
                          console.warn(
                            "⚠️ availableEditDestinations bukan array!"
                          );
                          return null;
                        }

                        // Cari detail destinasi berdasarkan destination_id
                        const destDetail = availableDestinations.find(
                          (dest) =>
                            dest.destination_id === itineraryDest.destination_id
                        );

                        return (
                          <li
                            key={
                              itineraryDest.destination_id || itineraryDest.id
                            }
                            className="flex items-center gap-2 p-2 border-b last:border-b-0"
                          >
                            <span className="text-sm">
                              {destDetail
                                ? destDetail.name
                                : "Unknown Destination"}
                            </span>
                            <span className="text-xs text-gray-500">
                              (
                              {destDetail
                                ? `${destDetail.city}, ${destDetail.country}`
                                : "Location Unknown"}
                              )
                            </span>
                          </li>
                        );
                      }
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No destinations added yet.
                  </p>
                )}
              </div>

              {/* Button to add more destinations */}
              <button
                type="button"
                onClick={() => {
                  if (selectedEditItinerary) {
                    setSelectedEditDestinations(
                      selectedEditItinerary.itinerary_destinations || []
                    );
                  }
                  setIsDestinationEditModalOpen(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Destination
              </button>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalEditOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDestinationEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Select Destination</h2>

            {/* Daftar Destinasi */}
            <div className="max-h-60 overflow-y-auto">
              {Array.isArray(availableEditDestinations?.data) &&
                availableEditDestinations.data.map((destination) => {
                  const selected = selectedEditDestinations.find(
                    (d) => d.destination_id === destination.destination_id
                  );

                  return (
                    <div
                      key={destination.destination_id}
                      className="flex flex-col p-2 border-b"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={(e) =>
                            handleSelectEditDestination(e, destination)
                          }
                        />
                        <span>
                          {destination.name} - {destination.city},{" "}
                          {destination.country}
                        </span>
                      </div>

                      {/* Input untuk Day */}
                      {selected && (
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Day (Hari Ke-)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={selected.day ?? 1} // ✅ Ambil nilai dari state utama
                            onChange={(e) => {
                              const value = e.target.value;
                              const newValue =
                                value === "" ? undefined : Number(value);

                              // Pastikan nilai valid sebelum update ke state utama
                              if (newValue === undefined || newValue >= 1) {
                                handleChangeEditDestinationDay(
                                  destination.destination_id,
                                  newValue
                                );
                              }
                            }}
                            className="w-16 border rounded p-1 text-center"
                            placeholder="1"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() =>
                  handlePageEditDestinationChange(
                    currentPageEditDestination - 1
                  )
                }
                disabled={currentPageEditDestination === 1}
                className={`px-4 py-2 rounded font-medium transition-all ${
                  currentPageEditDestination === 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Prev
              </button>

              <span className="text-gray-700 font-semibold">
                Page {currentPageEditDestination} of {totalPagesEditDestination}
              </span>

              <button
                onClick={() =>
                  handlePageEditDestinationChange(
                    currentPageEditDestination + 1
                  )
                }
                disabled={
                  currentPageEditDestination === totalPagesEditDestination
                }
                className={`px-4 py-2 rounded font-medium transition-all ${
                  currentPageEditDestination === totalPagesEditDestination
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Next
              </button>
            </div>

            {/* Tombol Confirm */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsDestinationEditModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEditDestination}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold">Konfirmasi Hapus</h2>
            <p>Apakah Anda yakin ingin menghapus itinerary ini?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Batal
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={deleteItinerary}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
