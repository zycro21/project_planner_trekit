"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import axios from "axios";
import {
  FaPlus,
  FaTimes,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Interface for Wishlist
interface Wishlist {
  user_id: string;
  wishlist_name: string;
  destination_ids: string[];
}

// Interface untuk Wishlist
interface WishlistData {
  id: string; // ID wishlist (jika ada)
  user: {
    name: string;
    email: string;
  };
  wishlist_name: string;
  added_at: string; // Tanggal ditambahkan
  wishlist_destinations: {
    destination: {
      destination_id: string;
      name: string;
      country: string;
      city: string;
    };
  }[];
}

interface Destination {
  destination_id: string;
  name: string;
  city: string;
  country: string;
}

interface User {
  user_id: string;
  name: string;
  email: string;
}

export default function WishlistPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Wishlist>({
    user_id: "", // Ini sebaiknya diisi dengan user_id yang sedang login
    wishlist_name: "",
    destination_ids: [],
  });

  const [destinationList, setDestinationList] = useState<Destination[]>([]);
  const [isLoadingDestinations, setIsLoadingDestinations] =
    useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreDestinations, setHasMoreDestinations] = useState<boolean>(true);

  const [users, setUsers] = useState<User[]>([]);
  const [pageUser, setPageUser] = useState(1);

  const [wishlists, setWishlists] = useState<WishlistData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPageMain, setCurrentPageMain] = useState(1);
  const limit = 10;

  // State untuk modal detail wishlist
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailWishlist, setSelectedDetailWishlist] =
    useState<WishlistData | null>(null);

  // State untuk modal edit wishlist
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedWishlistEdit, setSelectedWishlistEdit] =
    useState<WishlistData | null>(null);
  const [wishlistNameEdit, setWishlistNameEdit] = useState<string>("");
  const [tempSelectedDestinations, setTempSelectedDestinations] = useState<
    Destination[]
  >([]);
  const [selectedDestinationsEdit, setSelectedDestinationsEdit] = useState<
    Destination[]
  >([]);
  const [availableDestinationsEdit, setAvailableDestinationsEdit] = useState<
    Destination[]
  >([]);
  const [currentPageEdit, setCurrentPageEdit] = useState<number>(1);
  const [hasMoreDestinationsEdit, setHasMoreDestinationsEdit] =
    useState<boolean>(true);
  const [loadingDestinationsEdit, setLoadingDestinationsEdit] =
    useState<boolean>(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDeleteWishlist, setSelectedDeleteWishlist] = useState<
    string | null
  >(null);

  const fetchDestinations = async (nextPage: number) => {
    setIsLoadingDestinations(true);

    try {
      const limit = 10;
      const offset = (nextPage - 1) * limit;

      const res = await axios.get(
        `http://localhost:5000/api/destinations/destinations`,
        {
          params: { limit, offset },
          withCredentials: true,
        }
      );

      if (res.data && Array.isArray(res.data.data)) {
        setDestinationList((prevDestinations) => {
          const uniqueDestinations = new Map();
          [...prevDestinations, ...res.data.data].forEach((dest) => {
            uniqueDestinations.set(dest.destination_id, dest);
          });
          return Array.from(uniqueDestinations.values());
        });
        setHasMoreDestinations(nextPage < res.data.totalPages); // Cek apakah masih ada halaman berikutnya
        setCurrentPage(nextPage);
      } else {
        setHasMoreDestinations(false);
      }
    } catch (error) {
      console.error("Error fetching destinations", error);
    } finally {
      setIsLoadingDestinations(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/getUsers?limit=10&page=${pageUser}`,
        { withCredentials: true }
      );

      // Pastikan data ada sebelum melakukan map
      const usersData = res.data || [];

      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchDestinations(1);
      fetchUsers();
    }
  }, [isModalOpen, currentPage]);

  // Fetch Data Wishlist
  const fetchWishlists = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/wishlists/wishlists?page=${currentPageMain}&limit=${limit}&sort_by=${sortField}&sort_order=${sortOrder}`,
        { withCredentials: true }
      );

      console.log("Wishlists data:", response.data.data);
      setWishlists(response.data.data); // ✅ Sesuaikan dengan tipe WishlistData
    } catch (err) {
      setError("Gagal mengambil data wishlist.");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    fetchWishlists();
  }, [sortField, sortOrder, currentPageMain]);

  const handleCreateWishlist = async () => {
    if (
      !wishlist.user_id ||
      !wishlist.wishlist_name ||
      wishlist.destination_ids.length === 0
    ) {
      toast.error(
        "Semua field harus diisi, minimal satu destinasi harus dipilih"
      );
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:5000/api/wishlists/wishlist/create",
        wishlist,
        {
          withCredentials: true,
        }
      );
      if (response.data.success) {
        toast.success("Wishlist berhasil dibuat");
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Gagal membuat wishlist", error);
      toast.error("Gagal membuat wishlist");
    }
  };

  // Fungsi untuk mengambil detail wishlist
  const fetchWishlistDetail = async (id: string) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/wishlists/wishlist/${id}`,
        {
          withCredentials: true,
        }
      );
      if (response.data.success) {
        setSelectedDetailWishlist(response.data.data);
        setShowDetailModal(true);
      } else {
        toast.error("Gagal mengambil detail wishlist.");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengambil data wishlist.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Destinations (Untuk Modal Edit) dengan Pagination
  const fetchDestinationsEdit = async (nextPage: number) => {
    setLoadingDestinationsEdit(true);

    try {
      const limit = 10;
      const offset = (nextPage - 1) * limit;

      const res = await axios.get(
        `http://localhost:5000/api/destinations/destinations`,
        {
          params: { limit, offset },
          withCredentials: true,
        }
      );

      if (res.data && Array.isArray(res.data.data)) {
        setAvailableDestinationsEdit((prevDestinations) => {
          const uniqueDestinations = new Map();
          [...prevDestinations, ...res.data.data].forEach((dest) => {
            uniqueDestinations.set(dest.destination_id, dest);
          });
          return Array.from(uniqueDestinations.values());
        });

        setHasMoreDestinationsEdit(nextPage < res.data.totalPages); // Cek apakah masih ada halaman berikutnya
        setCurrentPageEdit(nextPage);
      } else {
        setHasMoreDestinationsEdit(false);
      }
    } catch (error) {
      console.error("Error fetching destinations", error);
    } finally {
      setLoadingDestinationsEdit(false);
    }
  };

  // Function untuk membuka modal edit
  const openEditModal = (wishlist: WishlistData) => {
    setSelectedWishlistEdit(wishlist);
    setWishlistNameEdit(wishlist.wishlist_name);
    setSelectedDestinationsEdit(
      wishlist.wishlist_destinations.map((d) => d.destination)
    );
    setIsEditModalOpen(true);
    fetchDestinationsEdit(1);
  };

  useEffect(() => {
    if (isEditModalOpen) {
      fetchDestinationsEdit(1);
    }
  }, [isEditModalOpen]);

  // Function untuk mengupdate wishlist
  const handleUpdateWishlist = async () => {
    if (!selectedWishlistEdit) return;
    try {
      await axios.put(
        `http://localhost:5000/api/wishlists/wishlist/${selectedWishlistEdit.id}`,
        {
          wishlist_name: wishlistNameEdit,
        },
        {
          withCredentials: true,
        }
      );

      toast.success("Wishlist updated successfully!");
      fetchWishlists(); // Refresh data setelah update
    } catch (error) {
      toast.error("Failed to update wishlist");
    }
  };

  // Fungsi untuk menambahkan destinasi ke daftar sementara
  const handleSelectDestination = (destinationId: string) => {
    if (!destinationId) return;

    const selectedDest = availableDestinationsEdit.find(
      (dest) => dest.destination_id === destinationId
    );

    if (
      selectedDest &&
      !tempSelectedDestinations.some(
        (dest) => dest.destination_id === destinationId
      )
    ) {
      setTempSelectedDestinations([...tempSelectedDestinations, selectedDest]);
    }
  };

  // Fungsi untuk menghapus destinasi dari daftar sementara
  const handleRemoveTempDestination = (destinationId: string) => {
    setTempSelectedDestinations(
      tempSelectedDestinations.filter(
        (dest) => dest.destination_id !== destinationId
      )
    );
  };

  // Fungsi untuk mengonfirmasi destinasi yang dipilih
  const handleConfirmDestinationsAddEdit = async () => {
    if (!selectedWishlistEdit) return;

    try {
      const destinationIds = tempSelectedDestinations.map(
        (dest) => dest.destination_id
      );
      await axios.post(
        "http://localhost:5000/api/wishlists/wishlist/add-destinations",
        {
          wishlist_id: selectedWishlistEdit.id,
          destination_ids: destinationIds,
        },
        {
          withCredentials: true,
        }
      );

      toast.success("Destinations added successfully!");
      fetchWishlists();
      setTempSelectedDestinations([]); // Kosongkan daftar sementara setelah update
    } catch (error) {
      toast.error("Failed to add destinations");
    }
  };

  // Function untuk menghapus destinasi dari wishlist
  const handleRemoveDestinationEdit = async (destinationId: string) => {
    if (!selectedWishlistEdit) return;
    try {
      await axios.delete(
        "http://localhost:5000/api/wishlists/wishlist/remove-destinations",
        {
          data: {
            wishlist_id: selectedWishlistEdit.id,
            destination_ids: [destinationId],
          },
          withCredentials: true,
        }
      );

      setSelectedDestinationsEdit(
        selectedDestinationsEdit.filter(
          (d) => d.destination_id !== destinationId
        )
      );

      toast.success("Destination removed successfully!");
      fetchWishlists(); // Refresh data setelah hapus destinasi
    } catch (error) {
      toast.error("Failed to remove destination");
    }
  };

  const handleDeleteClick = (wishlistId: string) => {
    setSelectedDeleteWishlist(wishlistId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDeleteWishlist) return;

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/wishlists/wishlist/${selectedDeleteWishlist}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("Wishlist berhasil dihapus! 🗑️");
        fetchWishlists(); // Refresh daftar wishlist
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Gagal menghapus wishlist:", error);
      toast.error("Terjadi kesalahan saat menghapus wishlist.");
    } finally {
      setShowDeleteModal(false);
      setSelectedDeleteWishlist(null);
    }
  };

  return (
    <div className="p-6 pt-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Wishlist Management</h1>
        <motion.button
          className="flex items-center justify-center bg-blue-600 text-white py-2 px-3 rounded-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
        >
          <FaPlus className="mr-2" /> Create Wishlist
        </motion.button>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="py-3 px-4 text-left">No</th>
              <th
                className="py-3 px-4 text-left cursor-pointer select-none"
                onClick={() => handleSort("wishlist_name")}
              >
                <span className="inline-flex items-center gap-1">
                  Wishlist Name{" "}
                  {sortField === "wishlist_name" &&
                    (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                </span>
              </th>
              <th className="py-3 px-4 text-left">User</th>
              <th className="py-3 px-4 text-left">Added At</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-red-500">
                  {error}
                </td>
              </tr>
            ) : wishlists.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  Data belum ada
                </td>
              </tr>
            ) : (
              wishlists.map((wishlist, index) => (
                <tr key={wishlist.id} className="border-b">
                  {/* ✅ Ubah ke wishlist.id */}
                  <td className="py-3 px-4">
                    {(currentPageMain - 1) * limit + index + 1}
                  </td>
                  <td className="py-3 px-4">{wishlist.wishlist_name}</td>
                  <td className="py-3 px-4">{wishlist.user.name}</td>
                  <td className="py-3 px-4">
                    {new Date(wishlist.added_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-center flex justify-center gap-2">
                    <button
                      className="bg-blue-100 text-gray-700 hover:bg-blue-200 p-2 rounded"
                      onClick={() => fetchWishlistDetail(wishlist.id)}
                    >
                      <FaEye />
                    </button>
                    <button
                      className="bg-yellow-200 text-yellow-900 p-2 rounded-lg hover:bg-yellow-300 transition"
                      onClick={() => openEditModal(wishlist)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="bg-red-100 text-gray-700 hover:bg-red-200 p-2 rounded"
                      onClick={() => handleDeleteClick(wishlist.id)}
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

      {/* Modal Create Wishlist */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg w-96"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create Wishlist</h2>
                <FaTimes
                  className="cursor-pointer text-gray-500 hover:text-red-500"
                  onClick={() => setIsModalOpen(false)}
                />
              </div>

              {/* Pilih User */}
              <label className="block mb-2">Select User:</label>
              <Select
                options={
                  users.length > 0
                    ? users.map((user) => ({
                        value: user.user_id,
                        label: `${user.name} (${user.email})`,
                      }))
                    : []
                } // Jika masih kosong, gunakan array kosong
                onChange={(selected) =>
                  setWishlist({ ...wishlist, user_id: selected?.value || "" })
                }
                className="mb-4"
              />

              {/* Wishlist Name */}
              <label className="block mb-2">Wishlist Name:</label>
              <input
                type="text"
                value={wishlist.wishlist_name}
                onChange={(e) =>
                  setWishlist({ ...wishlist, wishlist_name: e.target.value })
                }
                className="border p-2 rounded w-full"
              />

              {/* Pilih Destinations */}
              <label className="block mt-4 mb-2">Select Destinations:</label>
              <Select
                options={destinationList.map((dest) => ({
                  value: dest.destination_id,
                  label: dest.name,
                }))}
                isMulti
                onChange={(selected) =>
                  setWishlist({
                    ...wishlist,
                    destination_ids: selected.map((item) => item.value),
                  })
                }
                className="mb-4"
              />

              {hasMoreDestinations && (
                <button
                  className="text-blue-500 text-sm mt-2"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={isLoadingDestinations}
                >
                  {isLoadingDestinations
                    ? "Loading..."
                    : "Load more destinations"}
                </button>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end mt-4">
                <button
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={handleCreateWishlist}
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Detail Wishlist */}
      <AnimatePresence>
        {showDetailModal && selectedDetailWishlist && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          >
            <div className="bg-gray-100 rounded-lg shadow-xl w-96">
              {/* Header */}
              <div className="bg-blue-900 text-white p-4 rounded-t-lg">
                <h2 className="text-lg font-semibold">Detail Wishlist</h2>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-gray-700">
                  <strong>Nama Wishlist:</strong>{" "}
                  {selectedDetailWishlist.wishlist_name}
                </p>
                <p className="text-gray-700">
                  <strong>Ditambahkan oleh:</strong>{" "}
                  {selectedDetailWishlist.user.name} (
                  {selectedDetailWishlist.user.email})
                </p>
                <p className="text-gray-700">
                  <strong>Destinasi:</strong>
                </p>
                <ul className="list-disc ml-5 text-gray-600">
                  {selectedDetailWishlist.wishlist_destinations.map((item) => (
                    <li key={item.destination.destination_id}>
                      {item.destination.name} - {item.destination.city},{" "}
                      {item.destination.country}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="flex justify-end p-4 bg-gray-200 rounded-b-lg">
                <button
                  className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                  onClick={() => setShowDetailModal(false)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Edit Wishlist */}
      <AnimatePresence>
        {isEditModalOpen && selectedWishlistEdit && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg w-96"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Edit Wishlist</h2>

              {/* Input Edit Nama Wishlist */}
              <label className="block mb-2 text-sm font-medium">
                Wishlist Name
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded mb-4"
                value={wishlistNameEdit}
                onChange={(e) => setWishlistNameEdit(e.target.value)}
              />

              {/* Tombol Update Wishlist */}
              <button
                className="w-full bg-blue-500 text-white py-2 rounded mb-4 hover:bg-blue-600 transition"
                onClick={handleUpdateWishlist}
              >
                Update Wishlist
              </button>

              {/* Daftar Destinasi yang Sudah Ada */}
              <h3 className="text-lg font-semibold mb-2">
                Current Destinations
              </h3>
              <div className="max-h-40 overflow-y-auto border rounded p-2">
                {selectedDestinationsEdit.length > 0 ? (
                  selectedDestinationsEdit.map((dest) => (
                    <div
                      key={dest.destination_id}
                      className="flex justify-between items-center p-2 border-b"
                    >
                      <span>{dest.name}</span>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() =>
                          handleRemoveDestinationEdit(dest.destination_id)
                        }
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No destinations added yet.</p>
                )}
              </div>

              {/* Tambah Destinasi dengan Dropdown */}
              <h3 className="text-lg font-semibold mt-4 mb-2">
                Add Destination
              </h3>
              <select
                className="w-full p-2 border rounded mb-4"
                onChange={(e) => handleSelectDestination(e.target.value)}
              >
                <option value="">Select Destination</option>
                {availableDestinationsEdit.map((dest) => (
                  <option key={dest.destination_id} value={dest.destination_id}>
                    {dest.name}
                  </option>
                ))}
              </select>

              {/* Tombol Load More untuk memuat destinasi tambahan */}
              {hasMoreDestinationsEdit && !loadingDestinationsEdit && (
                <button
                  className="w-full bg-gray-300 py-2 rounded mb-4 hover:bg-gray-400 transition"
                  onClick={() => fetchDestinationsEdit(currentPageEdit + 1)}
                >
                  Load More
                </button>
              )}

              {/* Daftar destinasi yang dipilih sebelum dikonfirmasi */}
              <div className="flex flex-wrap gap-2">
                {tempSelectedDestinations.map((dest) => (
                  <div
                    key={dest.destination_id}
                    className="flex items-center gap-2 bg-gray-200 px-3 py-1 rounded-md"
                  >
                    <span>{dest.name}</span>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() =>
                        handleRemoveTempDestination(dest.destination_id)
                      }
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>

              {/* Tombol untuk konfirmasi penambahan */}
              {tempSelectedDestinations.length > 0 && (
                <button
                  className="w-full bg-green-500 text-white py-2 rounded mt-3 hover:bg-green-600 transition"
                  onClick={handleConfirmDestinationsAddEdit}
                >
                  Confirm Destinations
                </button>
              )}

              {/* Tombol Cancel */}
              <button
                className="w-full bg-gray-300 py-2 rounded hover:bg-gray-400 transition mt-3"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Hapus */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-2xl"
              initial={{ y: -50, scale: 0.8, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 50, scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 120 }}
            >
              <h2 className="text-lg font-bold mb-4 text-gray-800">
                Konfirmasi Hapus
              </h2>
              <p className="text-gray-600">
                Apakah Anda yakin ingin menghapus wishlist{" "}
                <span className="font-semibold text-red-500">
                  "{selectedDeleteWishlist}"
                </span>
                ?
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Batal
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                  onClick={handleConfirmDelete}
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
