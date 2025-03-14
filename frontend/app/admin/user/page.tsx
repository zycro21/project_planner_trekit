"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaSortUp, FaSortDown } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface User {
  user_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  is_verified: boolean;
}

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC" | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isHovered, setIsHovered] = useState(false); // Untuk tombol plus
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "",
    newPassword: "",
    oldPassword: "",
  });
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fungsi Get All Users
  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/users/getUsers",
        {
          params: {
            search: searchTerm || undefined,
            sort: sortOrder,
          },
          withCredentials: true,
        }
      );

      setUsers(response.data);
    } catch (err) {
      setError("Gagal mengambil data pengguna.");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Handle untuk Search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Fungsi Handler untuk Sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Jika sudah diurutkan ASC, ubah ke DESC
      if (sortOrder === "ASC") {
        setSortOrder("DESC");
      }
      // Jika sudah diurutkan DESC, reset ke default (tanpa ikon)
      else if (sortOrder === "DESC") {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      // Jika field berbeda, mulai dari ASC
      setSortField(field);
      setSortOrder("ASC");
    }
  };

  // Fungsi untuk mengambil user yang sedang login
  const fetchLoggedInUser = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users/me", {
        withCredentials: true,
      });

      setLoggedInUserId(response.data.user_id);
    } catch (error) {
      console.error("Gagal mengambil user yang sedang login");
    }
  };

  // Fungsi Menangani Input Perubahan dalam Form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Fungsi Submit Create ke API
  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/register",
        formData
      );

      toast.success(response.data.message, { position: "top-right" });
      setIsModalCreateOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error("Gagal membuat user. Coba lagi!", { position: "top-right" });
    }
  };

  // Fungsi Buka Modal Edit
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      newPassword: "",
      oldPassword: "",
    });
    setIsModalEditOpen(true);
  };

  // Fungsi handle perubahan form update atau edit
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  // Fungsi Submit Edit User dan Password
  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      if (loggedInUserId === selectedUser.user_id && editFormData.newPassword) {
        // Jika user sedang login dan ingin update password
        await axios.post(
          "http://localhost:5000/api/users/update-password",
          {
            oldPassword: editFormData.oldPassword,
            newPassword: editFormData.newPassword,
          },
          { withCredentials: true }
        );

        toast.success("Password berhasil diperbarui!", {
          position: "top-right",
        });
      } else {
        // Jika hanya update data umum
        await axios.put(
          `http://localhost:5000/api/users/${selectedUser.user_id}`,
          {
            name: editFormData.name,
            email: editFormData.email,
            role: editFormData.role,
          },
          { withCredentials: true }
        );

        toast.success("User berhasil diperbarui!", { position: "top-right" });
      }

      setIsModalEditOpen(false);
      fetchUsers(); // Refresh data user
    } catch (error) {
      toast.error("Gagal mengupdate user!", { position: "top-right" });
    }
  };

  // Fungsi Hapus User
  const handleDeleteUser = async () => {
    if (!selectedUserId) return;

    try {
      await axios.delete(`http://localhost:5000/api/users/${selectedUserId}`, {
        withCredentials: true,
      });

      toast.success("User berhasil dihapus!", { position: "top-right" });

      setUsers(users.filter((user) => user.user_id !== selectedUserId));
      setIsModalDeleteOpen(false);
    } catch (error) {
      toast.error("Gagal menghapus user!", { position: "top-right" });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLoggedInUser();
  }, [searchTerm, sortField, sortOrder]);

  return (
    <div className="p-6 pt-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">User Management</h1>

        <div className="flex justify-between items-center mb-4 gap-4">
          {/* Input Search */}
          <input
            type="text"
            placeholder="Search user..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="border p-2 rounded-md w-60"
          />

          {/* Tombol Create User */}
          <motion.button
            className="flex items-center justify-center bg-blue-600 text-white py-2 px-3 rounded-md transition-all overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ width: "40px" }}
            animate={{ width: isHovered ? "120px" : "40px" }}
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
              Create User
            </motion.span>
          </motion.button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-blue-900 text-white">
            <tr>
              {[
                { key: "user_id", label: "ID" },
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "role", label: "Role" },
                { key: "created_at", label: "Created" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="py-3 px-4 text-left cursor-pointer select-none"
                  onClick={() => handleSort(key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {sortField === key &&
                      (sortOrder === "ASC" ? (
                        <FaSortDown />
                      ) : sortOrder === "DESC" ? (
                        <FaSortUp />
                      ) : null)}
                  </span>
                </th>
              ))}
              <th className="py-3 px-4 text-left">Verified?</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr
                key={user.user_id ? user.user_id.toString() : `user-${index}`}
                className="border-b"
              >
                <td className="py-2 px-4">{user.user_id}</td>
                <td className="py-2 px-4">{user.name}</td>
                <td className="py-2 px-4">{user.email}</td>
                <td className="py-2 px-4">{user.role}</td>
                <td className="py-2 px-4">
                  {new Date(user.created_at).toISOString().split("T")[0]}
                </td>
                <td className="py-2 px-4">
                  {user.is_verified ? (
                    <span className="text-green-600 font-semibold">
                      Verified
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      Not Verified
                    </span>
                  )}
                </td>
                <td className="py-2 px-4 text-center">
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded"
                      onClick={() => {
                        setSelectedUserId(user.user_id);
                        setIsModalDeleteOpen(true);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal Create User*/}
      <AnimatePresence>
        {isModalCreateOpen && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { duration: 0.3 } }}
              exit={{ y: -50, opacity: 0, transition: { duration: 0.2 } }}
            >
              {/* Header Modal */}
              <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
                Create New User
              </h2>

              {/* Form */}
              <form onSubmit={submitCreate} className="space-y-4">
                {/* Nama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Create a password"
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select role</option>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {/* Tombol Aksi */}
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalCreateOpen(false)}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Hapus */}
      <AnimatePresence>
        {isModalDeleteOpen && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-md shadow-lg w-96"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
            >
              <h2 className="text-xl font-bold mb-4">Konfirmasi Hapus</h2>
              <p>Apakah Anda yakin ingin menghapus user ini?</p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsModalDeleteOpen(false)}
                  className="px-4 py-2 bg-gray-400 rounded"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Form Update User */}
      <AnimatePresence>
        {isModalEditOpen && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          >
            {/* Kotak Modal */}
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
              className="bg-white p-6 rounded-lg shadow-lg w-96 relative"
            >
              {/* Tombol Close */}
              <motion.button
                whileHover={{ scale: 1.2, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
                onClick={() => setIsModalEditOpen(false)}
              >
                ✖
              </motion.button>

              <h2 className="text-xl font-bold mb-4">Edit User</h2>
              <form onSubmit={submitEdit}>
                {/* Input Nama */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
                  className="mb-3"
                >
                  <label className="block text-sm font-medium">Name</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.3)",
                    }}
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className="w-full border p-2 rounded focus:outline-none"
                  />
                </motion.div>

                {/* Input Email */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                  className="mb-3"
                >
                  <label className="block text-sm font-medium">Email</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05,
                      boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.3)",
                    }}
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className="w-full border p-2 rounded focus:outline-none"
                  />
                </motion.div>

                {/* Input Role (Hanya jika loggedInUserId bukan user yang sedang diedit) */}
                {loggedInUserId !== selectedUser.user_id && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                    className="mb-3"
                  >
                    <label className="block text-sm font-medium">Role</label>
                    <motion.select
                      whileFocus={{
                        scale: 1.05,
                        boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.3)",
                      }}
                      name="role"
                      value={editFormData.role}
                      onChange={handleEditInputChange}
                      className="w-full border p-2 rounded focus:outline-none"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </motion.select>
                  </motion.div>
                )}

                {/* Input Password (Hanya untuk user yang sedang login) */}
                {loggedInUserId === selectedUser.user_id && (
                  <>
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        delay: 0.4,
                        type: "spring",
                        stiffness: 100,
                      }}
                      className="mb-3"
                    >
                      <label className="block text-sm font-medium">
                        Old Password
                      </label>
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(255, 0, 0, 0.3)",
                        }}
                        type="password"
                        name="oldPassword"
                        value={editFormData.oldPassword}
                        onChange={handleEditInputChange}
                        className="w-full border p-2 rounded focus:outline-none"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        delay: 0.5,
                        type: "spring",
                        stiffness: 100,
                      }}
                      className="mb-3"
                    >
                      <label className="block text-sm font-medium">
                        New Password
                      </label>
                      <motion.input
                        whileFocus={{
                          scale: 1.05,
                          boxShadow: "0px 0px 8px rgba(255, 0, 0, 0.3)",
                        }}
                        type="password"
                        name="newPassword"
                        value={editFormData.newPassword}
                        onChange={handleEditInputChange}
                        className="w-full border p-2 rounded focus:outline-none"
                      />
                    </motion.div>
                  </>
                )}

                {/* Tombol Aksi */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex justify-end gap-2 mt-4"
                >
                  <motion.button
                    whileHover={{
                      scale: 1.1,
                      boxShadow: "0px 0px 10px rgba(128, 128, 128, 0.5)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="bg-gray-400 text-white px-4 py-2 rounded"
                    onClick={() => setIsModalEditOpen(false)}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{
                      scale: 1.1,
                      boxShadow: "0px 0px 10px rgba(0, 128, 255, 0.5)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Update
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
