"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

export default function DestinationPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State untuk Create
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [formCreateData, setFormCreateData] = useState({
    name: "",
    country: "",
    city: "",
    latitude: "",
    longitude: "",
    description: "",
    images: [] as File[],
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // State untuk Detail
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // State untuk Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    destination_id: "",
    name: "",
    latitude: "",
    longitude: "",
    description: "",
    images: [] as File[], // Gambar baru yang dipilih
  });
  const [existingImages, setExistingImages] = useState<string[]>([]); // Gambar lama
  const [imagePreviewsEdit, setImagePreviewsEdit] = useState<string[]>([]); // Preview gambar baru

  // State untuk Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteSelectedDestinationId, setDeleteSelectedDestinationId] =
    useState<string | null>(null);

  const fetchDestinations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/destinations/destinations",
        {
          withCredentials: true,
        }
      );

      setDestinations(response.data.data);
    } catch (err) {
      setError("Gagal mengambil data destinasi");
    } finally {
      setLoading(false);
    }
  };

  // Handle perubahan input form create
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormCreateData({ ...formCreateData, [e.target.name]: e.target.value });
  };

  // Handle perubahan input file gambar
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Gabungkan gambar baru dengan yang lama
      setFormCreateData((prev) => ({
        ...prev,
        images: [...prev.images, ...newFiles],
      }));

      // Buat preview gambar baru
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormCreateData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));

    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("name", formCreateData.name);
    formDataToSend.append("country", formCreateData.country);
    formDataToSend.append("city", formCreateData.city);
    if (formCreateData.latitude)
      formDataToSend.append("latitude", formCreateData.latitude);
    if (formCreateData.longitude)
      formDataToSend.append("longitude", formCreateData.longitude);
    if (formCreateData.description)
      formDataToSend.append("description", formCreateData.description);
    formCreateData.images.forEach((image) =>
      formDataToSend.append("images", image)
    );

    try {
      await axios.post(
        "http://localhost:5000/api/destinations/destinations",
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      toast.success("Destination berhasil ditambahkan!");
      setIsModalCreateOpen(false);
      fetchDestinations(); // Refresh data
    } catch (error) {
      toast.error("Gagal menambahkan destinasi");
    }
  };

  const fetchDestinationDetail = async (destinationId: string) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/destinations/destinations/${destinationId}`,
        {
          withCredentials: true,
        }
      );
      setSelectedDestination(response.data);
      setIsDetailModalOpen(true);
      setActiveTab("info");
    } catch (error) {
      console.error("Gagal mengambil data destinasi:", error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteSelectedDestinationId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteDestination = async () => {
    if (!deleteSelectedDestinationId) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/destinations/destinations/${deleteSelectedDestinationId}`,
        {
          withCredentials: true,
        }
      );

      // Perbarui data di tabel tanpa refresh
      setDestinations((prev) =>
        prev.filter(
          (dest) => dest.destination_id !== deleteSelectedDestinationId
        )
      );

      setIsDeleteModalOpen(false);
      setDeleteSelectedDestinationId(null);

      toast.success("Destinasi berhasil dihapus!");
    } catch (error) {
      console.error("Gagal menghapus destinasi:", error);

      // Notifikasi gagal
      toast.error("Gagal menghapus destinasi!");
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  return (
    <div className="p-6 pt-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Destination Management</h1>

        {/* Tombol Create Destination */}
        <motion.button
          className="flex items-center justify-center bg-blue-600 text-white py-2 px-3 rounded-md transition-all overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ width: "40px" }}
          animate={{ width: isHovered ? "150px" : "40px" }}
          transition={{ duration: 0.3 }}
          onClick={() => setIsModalCreateOpen(true)}
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
            Create Destination
          </motion.span>
        </motion.button>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="py-3 px-4 text-left">No</th>
              <th className="py-3 px-4 text-left">ID</th>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Country</th>
              <th className="py-3 px-4 text-left">City</th>
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
            ) : destinations.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  Data belum ada
                </td>
              </tr>
            ) : (
              destinations.map((destination, index) => (
                <tr key={destination.destination_id} className="border-b">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4">{destination.destination_id}</td>
                  <td className="py-3 px-4">{destination.name}</td>
                  <td className="py-3 px-4">{destination.country}</td>
                  <td className="py-3 px-4">{destination.city}</td>
                  <td className="py-3 px-4 text-center flex justify-center gap-2">
                    <button
                      className="bg-blue-100 text-gray-700 hover:bg-blue-200 p-2 rounded"
                      onClick={() =>
                        fetchDestinationDetail(destination.destination_id)
                      }
                    >
                      <FaEye />
                    </button>
                    <button className="bg-yellow-100 text-gray-700 hover:bg-yellow-200 p-2 rounded">
                      <FaEdit />
                    </button>
                    <button
                      className="bg-red-100 text-gray-700 hover:bg-red-200 p-2 rounded"
                      onClick={() =>
                        handleDeleteClick(destination.destination_id)
                      }
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

      {/* Modal Create */}
      <AnimatePresence>
        {isModalCreateOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsModalCreateOpen(false);
            }}
          >
            <form
              className="bg-white p-6 rounded-lg shadow-lg w-[400px] max-h-[90vh] overflow-y-auto transition-transform transform scale-95 hover:scale-100"
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()} // Biar klik dalam modal tidak menutup
            >
              <h2 className="text-xl font-bold mb-4 text-center">
                Create New Destination
              </h2>

              {/* Nama */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="border p-2 w-full rounded-md"
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Negara */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  className="border p-2 w-full rounded-md"
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Kota */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  className="border p-2 w-full rounded-md"
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Latitude & Longitude */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Latitude
                  </label>
                  <input
                    type="text"
                    name="latitude"
                    className="border p-2 w-full rounded-md"
                    placeholder="(Optional)"
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(
                        /[^0-9.,-]/g,
                        ""
                      ); // Hanya angka, titik, koma, dan minus
                    }}
                    onBlur={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(
                        ",",
                        "."
                      ); // Ganti koma jadi titik
                    }}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Longitude
                  </label>
                  <input
                    type="text"
                    name="longitude"
                    className="border p-2 w-full rounded-md"
                    placeholder="(Optional)"
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(
                        /[^0-9.,-]/g,
                        ""
                      );
                    }}
                    onBlur={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(
                        ",",
                        "."
                      );
                    }}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  className="border p-2 w-full rounded-md"
                  placeholder="Write something... (Optional)"
                  onChange={handleChange}
                />
              </div>

              {/* Upload Gambar */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Upload Images
                </label>
                <input
                  type="file"
                  multiple
                  className="border p-2 w-full rounded-md"
                  onChange={handleImageChange}
                />
              </div>

              {/* Preview Gambar */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 border p-3 rounded-md bg-gray-100">
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={src}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-md shadow-md"
                      />
                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tombol Aksi */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalCreateOpen(false)}
                  className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Detail */}

      <AnimatePresence>
        {isDetailModalOpen && selectedDestination && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center"
            onClick={() => setIsDetailModalOpen(false)} // Klik luar modal buat tutup
          >
            <motion.div
              key="modal-content"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-lg w-3/4 max-w-2xl relative"
              onClick={(e) => e.stopPropagation()} // Biar klik dalam modal nggak nutup modal
            >
              {/* Tombol Close */}
              <button
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-transform duration-200 hover:scale-110"
                onClick={() => setIsDetailModalOpen(false)}
              >
                <FaTimes className="w-6 h-6" />
              </button>

              {/* Tab Navigation */}
              <div className="flex justify-around border-b pb-2 mb-4">
                {["info", "images", "itinerary", "reviews", "wishlist"].map(
                  (tab) => (
                    <button
                      key={tab}
                      className={`px-4 py-2 text-sm font-semibold ${
                        activeTab === tab
                          ? "border-b-2 border-blue-500 text-blue-500"
                          : "text-gray-500"
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  )
                )}
              </div>

              {/* Tab Content */}
              {activeTab === "info" && (
                <>
                  <h2 className="text-xl font-semibold mb-4">
                    {selectedDestination.name}
                  </h2>
                  <p>
                    <strong>Negara:</strong> {selectedDestination.country}
                  </p>
                  <p>
                    <strong>Kota:</strong> {selectedDestination.city}
                  </p>
                  <p>
                    <strong>Latitude:</strong> {selectedDestination.latitude}
                  </p>
                  <p>
                    <strong>Longitude:</strong> {selectedDestination.longitude}
                  </p>
                  <p>
                    <strong>Deskripsi:</strong>{" "}
                    {selectedDestination.description}
                  </p>
                </>
              )}

              {activeTab === "images" && (
                <div className="mt-4">
                  {(selectedDestination.images ?? []).length > 0 ? (
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      {(selectedDestination.images ?? []).map((img) => (
                        <motion.img
                          key={img.image_id}
                          src={`http://localhost:5000${img.image_url}`}
                          alt="Destination"
                          className="w-60 h-60 object-cover rounded transition-transform duration-200 hover:scale-110 hover:shadow-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Tidak ada gambar</p>
                  )}
                </div>
              )}

              {activeTab === "itinerary" && (
                <div className="mt-4">
                  <strong>Itinerary:</strong>
                  {(selectedDestination.itinerary_destinations ?? []).length >
                  0 ? (
                    <ul className="list-disc ml-4">
                      {(selectedDestination.itinerary_destinations ?? []).map(
                        (itinerary) => (
                          <li key={itinerary.id}>{itinerary.detail}</li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Tidak ada itinerary</p>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="mt-4">
                  <strong>Reviews:</strong>
                  {(selectedDestination.reviews ?? []).length > 0 ? (
                    <ul className="list-disc ml-4">
                      {(selectedDestination.reviews ?? []).map((review) => (
                        <li key={review.id}>{review.comment}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Tidak ada review</p>
                  )}
                </div>
              )}

              {activeTab === "wishlist" && (
                <div className="mt-4">
                  <strong>Wishlist:</strong>
                  {(selectedDestination.wishlist_destinations ?? []).length >
                  0 ? (
                    <ul className="list-disc ml-4">
                      {(selectedDestination.wishlist_destinations ?? []).map(
                        (wishlist) => (
                          <li key={wishlist.id}>{wishlist.user_id}</li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Tidak ada wishlist</p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold">Konfirmasi Hapus</h2>
            <p>Apakah Anda yakin ingin menghapus destinasi ini?</p>

            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded mr-2"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded"
                onClick={handleDeleteDestination}
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
