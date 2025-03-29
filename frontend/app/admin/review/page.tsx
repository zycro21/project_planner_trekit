"use client";

import React, { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";
import {
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Interface TypeScript untuk data Review
interface Review {
  review_id: string;
  user: {
    user_id: string;
    name: string;
  };
  destination: {
    destination_id: string;
    name: string;
  };
  rating: number;
  comment?: string;
  created_at: string;
}

// Interface untuk User & Destination
interface User {
  user_id: string;
  name: string;
}

interface Destination {
  destination_id: string;
  name: string;
}

export default function ReviewPage() {
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [currentPageReview, setCurrentPageReview] = useState<number>(1);
  const [totalReviewCount, setTotalReviewCount] = useState<number>(0);
  const [reviewLimitPerPage, setReviewLimitPerPage] = useState<number>(10);
  const [sortByColumn, setSortByColumn] = useState<string>("created_at");
  const [sortOrderDirection, setSortOrderDirection] = useState<"ASC" | "DESC">(
    "DESC"
  );

  const [users, setUsers] = useState<User[]>([]);
  const [pageUser, setPageUser] = useState(1);

  const [destinationList, setDestinationList] = useState<Destination[]>([]);
  const [isLoadingDestinations, setIsLoadingDestinations] =
    useState<boolean>(false);
  const [currentPageDestinations, setCurrentPageDestinations] =
    useState<number>(1);
  const [hasMoreDestinations, setHasMoreDestinations] = useState<boolean>(true); // Apakah masih ada data?

  // State untuk create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [newReview, setNewReview] = useState({
    user_id: "",
    destination_id: "",
    rating: 1,
    comment: "",
  });

  // State untuk Update
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateReview, setUpdateReview] = useState({
    review_id: "",
    rating: 1,
    comment: "",
  });

  // State Modal Hapus
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteReviewId, setSelectedDeleteReviewId] = useState<
    string | null
  >(null);

  const fetchReviewData = async (
    page: number,
    sortBy: string,
    sortOrder: "ASC" | "DESC"
  ) => {
    try {
      const offsetValue = (page - 1) * reviewLimitPerPage;
      const response = await axios.get(
        "http://localhost:5000/api/reviews/reviews",
        {
          params: {
            limit: reviewLimitPerPage,
            offset: offsetValue,
            sortBy, // Pastikan sortBy dikirim
            sort: sortOrder,
          },
          withCredentials: true, // Tambahkan ini untuk mengirim cookie
        }
      );

      setReviewList(response.data.reviews);
      setTotalReviewCount(response.data.total);
      setCurrentPageReview(page);
    } catch (error) {
      console.error("Error fetching reviews", error);
    }
  };

  useEffect(() => {
    fetchReviewData(currentPageReview, sortByColumn, sortOrderDirection);
  }, [currentPageReview, sortByColumn, sortOrderDirection]);

  const handlePageChangeReview = (page: number) => {
    setCurrentPageReview(page);
  };

  const totalPagesReview = Math.ceil(totalReviewCount / reviewLimitPerPage);

  const handleSortByColumn = (column: string) => {
    const newSortOrder =
      sortByColumn === column && sortOrderDirection === "ASC" ? "DESC" : "ASC";
    setSortByColumn(column);
    setSortOrderDirection(newSortOrder);
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/getUsers?limit=10&page=${pageUser}`,
        { withCredentials: true }
      );
      console.log("Fetched users:", res.data);
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  };

  const userOptions = users.map((user) => ({
    value: user.user_id,
    label: user.name,
  }));

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
        setCurrentPageDestinations(nextPage);
      } else {
        setHasMoreDestinations(false);
      }
    } catch (error) {
      console.error("Error fetching destinations", error);
    } finally {
      setIsLoadingDestinations(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchUsers();
      fetchDestinations(1);
    }
  }, [isModalOpen]);

  const handleCreateReview = async () => {
    try {
      await axios.post("http://localhost:5000/api/reviews/review", newReview, {
        withCredentials: true,
      });
      toast.success("Review berhasil ditambahkan!");
      setIsModalOpen(false);

      // Pastikan memanggil fetchReviewData dengan parameter yang sesuai
      fetchReviewData(currentPageReview, sortByColumn, sortOrderDirection);
    } catch (error) {
      toast.error("Gagal menambahkan review");
      console.error("Error creating review", error);
    }
  };

  const handleEditClick = (review: Review) => {
    setUpdateReview({
      review_id: review.review_id,
      rating: review.rating,
      comment: review.comment || "",
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateReview = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/reviews/${updateReview.review_id}`,
        {
          rating: updateReview.rating,
          comment: updateReview.comment,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setReviewList((prevReviews) =>
          prevReviews.map((rev) =>
            rev.review_id === updateReview.review_id
              ? {
                  ...rev,
                  rating: updateReview.rating,
                  comment: updateReview.comment,
                }
              : rev
          )
        );
        setIsUpdateModalOpen(false);

        // ✅ Notifikasi sukses
        toast.success("Review berhasil diperbarui! 🎉");
      }
    } catch (error) {
      console.error("Gagal memperbarui review", error);

      // ❌ Notifikasi error
      toast.error("Gagal memperbarui review. Coba lagi!");
    }
  };

  // Buka modal hapus review
  const openDeleteModal = (reviewId: string) => {
    setSelectedDeleteReviewId(reviewId);
    setIsDeleteModalOpen(true);
  };

  // Tutup modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedDeleteReviewId(null);
  };

  // Hapus review
  const handleDeleteReview = async () => {
    if (!selectedDeleteReviewId) return;

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/reviews/${selectedDeleteReviewId}`,
        {
          withCredentials: true, // Pastikan mengirim cookie autentikasi
        }
      );

      if (response.data.success) {
        // ✅ Notifikasi sukses
        toast.success("Review berhasil dihapus! 🗑️");

        // Refresh daftar review setelah menghapus
        fetchReviewData(currentPageReview, sortByColumn, sortOrderDirection);
      } else {
        // ❌ Notifikasi gagal dari server
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Gagal menghapus review:", error);

      // ❌ Notifikasi error
      toast.error("Terjadi kesalahan saat menghapus review.");
    } finally {
      closeDeleteModal();
    }
  };

  return (
    <div className="p-6 pt-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Review Management</h1>
        <motion.button
          className="flex items-center justify-center bg-blue-600 text-white py-2 px-3 rounded-md transition-all overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ width: "40px" }}
          animate={{ width: isHovered ? "150px" : "40px" }}
          transition={{ duration: 0.3 }}
          onClick={() => setIsModalOpen(true)}
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
            Add Review
          </motion.span>
        </motion.button>
      </div>
      
      {/* Tabel */}
      <div className="overflow-x-auto shadow-md rounded-lg p-4">
        <table className="w-full border-collapse">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="p-3 text-center">No</th>
              <th
                className="p-3 cursor-pointer text-left"
                onClick={() => handleSortByColumn("user.name")}
              >
                User{" "}
                {sortByColumn === "user.name"
                  ? sortOrderDirection === "ASC"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th
                className="p-3 cursor-pointer text-left"
                onClick={() => handleSortByColumn("destination.name")}
              >
                Destination{" "}
                {sortByColumn === "destination.name"
                  ? sortOrderDirection === "ASC"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th
                className="p-3 cursor-pointer text-center"
                onClick={() => handleSortByColumn("rating")}
              >
                Rating{" "}
                {sortByColumn === "rating"
                  ? sortOrderDirection === "ASC"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th className="p-3 text-left">Comment</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-100">
            {reviewList.map((review, index) => (
              <tr
                key={review.review_id}
                className="border-b border-gray-300 hover:bg-gray-200 transition-all duration-200"
              >
                <td className="p-3 text-center">
                  {(currentPageReview - 1) * reviewLimitPerPage + index + 1}
                </td>
                <td className="p-3">{review.user.name}</td>
                <td className="p-3">{review.destination.name}</td>
                <td className="p-3 text-center">{review.rating}</td>
                <td className="p-3">{review.comment || "-"}</td>
                <td className="p-3 flex justify-center gap-2">
                  <button className="bg-blue-200 text-blue-900 p-2 rounded-lg hover:bg-blue-300 transition">
                    <FaEye />
                  </button>
                  <button
                    className="bg-yellow-200 text-yellow-900 p-2 rounded-lg hover:bg-yellow-300 transition"
                    onClick={() => handleEditClick(review)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="bg-red-200 text-red-900 p-2 rounded-lg hover:bg-red-300 transition"
                    onClick={() => openDeleteModal(review.review_id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4">
        {/* Tombol Prev */}
        <button
          className={`px-3 py-2 rounded ${
            currentPageReview === 1
              ? "text-gray-400 cursor-not-allowed"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => handlePageChangeReview(currentPageReview - 1)}
          disabled={currentPageReview === 1}
        >
          <FaChevronLeft />
        </button>

        {/* Logika Menampilkan Nomor Halaman */}
        {currentPageReview > 2 && totalPagesReview > 3 && (
          <span className="px-3">...</span>
        )}

        {Array.from({ length: totalPagesReview }, (_, i) => i + 1)
          .filter(
            (page) =>
              page === 1 ||
              page === totalPagesReview ||
              (page >= currentPageReview - 1 && page <= currentPageReview + 1)
          )
          .map((page) => (
            <button
              key={page}
              className={`px-3 py-2 rounded ${
                currentPageReview === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() => handlePageChangeReview(page)}
            >
              {page}
            </button>
          ))}

        {currentPageReview < totalPagesReview - 1 && totalPagesReview > 3 && (
          <span className="px-3">...</span>
        )}

        {/* Tombol Next */}
        <button
          className={`px-3 py-2 rounded ${
            currentPageReview === totalPagesReview
              ? "text-gray-400 cursor-not-allowed"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => handlePageChangeReview(currentPageReview + 1)}
          disabled={currentPageReview === totalPagesReview}
        >
          <FaChevronRight />
        </button>
      </div>
      {/* Modal Create Review */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
          <div className="bg-white p-6 rounded-md w-96 shadow-lg transform transition-all scale-95 animate-scaleUp">
            <h2 className="text-xl font-bold mb-4 text-center">
              Create Review
            </h2>
            <select
              className="border p-2 w-full mb-2 rounded-md focus:ring-2 focus:ring-blue-400"
              style={{ maxHeight: "200px", overflowY: "auto" }}
              onChange={(e) =>
                setNewReview({ ...newReview, user_id: e.target.value })
              }
            >
              <option value="">Select User</option>
              {users.length > 0 ? (
                <optgroup label="Users">
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.name}
                    </option>
                  ))}
                </optgroup>
              ) : (
                <option disabled>Loading users...</option>
              )}
            </select>
            {/* Select Destination */}
            <div>
              {/* Select Dropdown */}
              <select
                className="border p-2 w-full mb-2 rounded-md focus:ring-2 focus:ring-blue-400 max-h-40 overflow-y-auto"
                onChange={(e) =>
                  setNewReview({ ...newReview, destination_id: e.target.value })
                }
              >
                <option value="">Select Destination</option>
                {destinationList.length > 0 ? (
                  destinationList.map((destinationItem) => (
                    <option
                      key={destinationItem.destination_id}
                      value={destinationItem.destination_id}
                    >
                      {destinationItem.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No destinations found</option>
                )}
              </select>

              {/* Tombol Load More */}
              {hasMoreDestinations && (
                <button
                  onClick={() => fetchDestinations(currentPageDestinations + 1)}
                  disabled={isLoadingDestinations}
                  className="mt-2 p-2 bg-blue-500 text-white rounded-md w-full"
                >
                  {isLoadingDestinations ? "Loading..." : "Load More"}
                </button>
              )}
            </div>
            <input
              type="number"
              className="border p-2 w-full mb-2 rounded-md focus:ring-2 focus:ring-blue-400"
              min="1"
              max="5"
              placeholder="Rating (1-5)"
              onChange={(e) =>
                setNewReview({ ...newReview, rating: Number(e.target.value) })
              }
            />
            <textarea
              className="border p-2 w-full mb-2 rounded-md focus:ring-2 focus:ring-blue-400"
              placeholder="Comment (optional)"
              onChange={(e) =>
                setNewReview({ ...newReview, comment: e.target.value })
              }
            />
            <div className="flex gap-2">
              <button
                className="bg-blue-600 text-white py-2 px-3 rounded-md w-full transition-transform transform hover:scale-105 active:scale-95"
                onClick={handleCreateReview}
              >
                Submit Review
              </button>
              <button
                className="bg-gray-400 text-white py-2 px-3 rounded-md w-full transition-transform transform hover:scale-105 active:scale-95"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Update Review */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white p-6 rounded-2xl shadow-2xl w-96"
            >
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">
                Update Review
              </h2>

              <label className="block mb-2 text-gray-600 font-medium">
                Rating:
              </label>
              <input
                type="number"
                value={updateReview.rating}
                onChange={(e) =>
                  setUpdateReview((prev) => ({
                    ...prev,
                    rating: Number(e.target.value),
                  }))
                }
                className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:outline-none transition duration-300 shadow-sm"
                min={1}
                max={5}
              />

              <label className="block mt-4 mb-2 text-gray-600 font-medium">
                Comment:
              </label>
              <textarea
                value={updateReview.comment}
                onChange={(e) =>
                  setUpdateReview((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:outline-none transition duration-300 shadow-sm resize-none"
                rows={3}
              />

              <div className="flex justify-end mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition duration-300 hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 mr-2"
                  onClick={() => setIsUpdateModalOpen(false)}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg transition duration-300 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                  onClick={handleUpdateReview}
                >
                  Update
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
      {/* Modal Konfirmasi Hapus */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold">Konfirmasi Hapus</h2>
            <p>Apakah Anda yakin ingin menghapus review ini?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={handleDeleteReview}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
