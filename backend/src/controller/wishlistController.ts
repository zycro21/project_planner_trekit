import { Request, Response } from "express";
import { WishlistModel } from "../models/Wishlist";
import { PrismaClient, Prisma, Review } from "@prisma/client";

const prisma = new PrismaClient();

export class WishlistController {
  // 📌 Membuat wishlist baru dengan banyak destinasi
  static async createWishlist(req: Request, res: Response) {
    try {
      const { user_id, wishlist_name, destination_ids } = req.body;

      if (
        !user_id ||
        !wishlist_name ||
        !Array.isArray(destination_ids) ||
        destination_ids.length === 0
      ) {
        res.status(400).json({
          success: false,
          message:
            "User ID, Wishlist Name, dan minimal satu Destination ID wajib diisi.",
        });
        return;
      }

      const newWishlist = await WishlistModel.createWishlist(
        user_id,
        wishlist_name,
        destination_ids
      );

      res.status(201).json({
        success: true,
        message: "Wishlist berhasil dibuat.",
        data: newWishlist,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal membuat wishlist.",
        error: error.message,
      });
    }
  }

  // 📌 Menambahkan satu atau lebih destinasi ke wishlist yang sudah ada
  static async addDestinationsToWishlist(req: Request, res: Response) {
    try {
      const { wishlist_id, destination_ids } = req.body;
      const userId = req.user?.user_id; // Ambil user_id dari token JWT
      const userRole = req.user?.role; // Ambil role dari token JWT

      if (
        !wishlist_id ||
        !Array.isArray(destination_ids) ||
        destination_ids.length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "Wishlist ID dan array Destination IDs wajib diisi.",
        });
        return;
      }

      // Cek apakah wishlist ada dan ambil user_id pembuatnya
      const wishlist = await prisma.wishlist.findUnique({
        where: { id: wishlist_id },
        select: { user_id: true },
      });

      if (!wishlist) {
        res.status(404).json({
          success: false,
          message: "Wishlist tidak ditemukan.",
        });
        return;
      }

      // Hanya user yang membuat wishlist atau admin yang boleh menambahkan destinasi
      if (wishlist.user_id !== userId && userRole !== "ADMIN") {
        res.status(403).json({
          success: false,
          message:
            "Anda tidak memiliki izin untuk menambahkan destinasi ke wishlist ini.",
        });
        return;
      }

      // Tambahkan destinasi ke wishlist
      await WishlistModel.addDestinationsToWishlist(
        wishlist_id,
        destination_ids
      );

      res.status(200).json({
        success: true,
        message: "Destinasi berhasil ditambahkan ke wishlist.",
      });
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal menambahkan destinasi ke wishlist.",
        error: error.message,
      });
      return;
    }
  }

  // 📌 Mengambil semua wishlist dengan pagination & sorting
  static async getAllWishlists(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sort_by as string) || "date";
      const sortOrder = (req.query.sort_order as string) || "desc";

      const { wishlists, totalWishlists } = await WishlistModel.findAll(
        page,
        limit,
        sortBy,
        sortOrder
      );

      res.json({
        success: true,
        message: "Data wishlist berhasil diambil.",
        total: totalWishlists,
        totalPages: Math.ceil(totalWishlists / limit),
        currentPage: page,
        perPage: limit,
        data: wishlists,
      });
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil semua wishlist.",
        error: error.message,
      });
      return;
    }
  }

  // 📌 Mengambil wishlist berdasarkan ID
  static async getWishlistById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Wishlist ID wajib diisi.",
        });
        return;
      }

      const wishlist = await WishlistModel.findById(id);

      if (!wishlist) {
        res.status(404).json({
          success: false,
          message: "Wishlist tidak ditemukan.",
        });
        return;
      }

      res.json({
        success: true,
        message: "Wishlist berhasil ditemukan.",
        data: wishlist,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil wishlist.",
        error: error.message,
      });
    }
  }

  // 📌 Mengambil wishlist berdasarkan user_id
  static async getWishlistsByUser(req: Request, res: Response) {
    try {
      const { user_id } = req.params;

      if (!user_id) {
        res.status(400).json({
          success: false,
          message: "User ID wajib diisi.",
        });
        return;
      }

      const wishlists = await WishlistModel.findAllByUser(user_id);

      if (wishlists.length === 0) {
        res.status(404).json({
          success: false,
          message: "Wishlist tidak ditemukan untuk user ini.",
        });
        return;
      }

      res.json({
        success: true,
        message: "Wishlist berhasil ditemukan.",
        total: wishlists.length,
        data: wishlists,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil wishlist berdasarkan user.",
        error: error.message,
      });
    }
  }

  // Menghapus satu atau lebih destinasi dari wishlist
  static async removeDestinationsFromWishlist(req: Request, res: Response) {
    try {
      const { wishlist_id, destination_ids } = req.body;
      const userId = req.user?.user_id; // Ambil user_id dari token
      const userRole = req.user?.role; // Ambil role dari token

      // 🔹 Validasi input
      if (
        !wishlist_id ||
        !Array.isArray(destination_ids) ||
        destination_ids.length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "Wishlist ID dan array Destination IDs wajib diisi.",
        });
        return;
      }

      // 🔹 Cari wishlist berdasarkan ID
      const wishlist = await prisma.wishlist.findUnique({
        where: { id: wishlist_id },
        select: { user_id: true }, // Ambil hanya user_id pemiliknya
      });

      // 🔹 Jika wishlist tidak ditemukan
      if (!wishlist) {
        res.status(404).json({
          success: false,
          message: "Wishlist tidak ditemukan.",
        });
        return;
      }

      // 🔹 Cek apakah user adalah pemilik wishlist atau ADMIN
      if (wishlist.user_id !== userId && userRole !== "ADMIN") {
        res.status(403).json({
          success: false,
          message:
            "Anda tidak memiliki izin untuk menghapus destinasi dari wishlist ini.",
        });
        return;
      }

      // 🔹 Hapus destinasi dari wishlist
      await WishlistModel.removeDestinationsFromWishlist(
        wishlist_id,
        destination_ids
      );

      res.json({
        success: true,
        message: "Destinasi berhasil dihapus dari wishlist.",
      });
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal menghapus destinasi dari wishlist.",
        error: error.message,
      });
      return;
    }
  }

  // 📌 Menghapus wishlist berdasarkan ID (termasuk semua relasinya)
  static async deleteWishlist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.user_id; // Ambil user_id dari token
      const userRole = req.user?.role; // Ambil role dari token

      // 🔹 Validasi input
      if (!id) {
        res.status(400).json({
          success: false,
          message: "Wishlist ID wajib diisi.",
        });
        return;
      }

      // 🔹 Cari wishlist berdasarkan ID
      const wishlist = await prisma.wishlist.findUnique({
        where: { id },
        select: { user_id: true }, // Ambil hanya user_id pemiliknya
      });

      // 🔹 Jika wishlist tidak ditemukan
      if (!wishlist) {
        res.status(404).json({
          success: false,
          message: "Wishlist tidak ditemukan.",
        });
        return;
      }

      // 🔹 Cek apakah user adalah pemilik wishlist atau ADMIN
      if (wishlist.user_id !== userId && userRole !== "ADMIN") {
        res.status(403).json({
          success: false,
          message: "Anda tidak memiliki izin untuk menghapus wishlist ini.",
        });
        return;
      }

      // 🔹 Hapus wishlist
      await WishlistModel.delete(id);

      res.json({
        success: true,
        message: "Wishlist berhasil dihapus.",
      });
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal menghapus wishlist.",
        error: error.message,
      });
      return;
    }
  }

  // 📌 Update nama wishlist
  static async updateWishlistName(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { wishlist_name } = req.body;
      const userId = req.user?.user_id; // Ambil user_id dari token
      const userRole = req.user?.role; // Ambil role dari token

      if (!wishlist_name) {
        res.status(400).json({
          success: false,
          message: "Nama wishlist wajib diisi.",
        });
        return;
      }

      // 🔹 Cek apakah wishlist ada
      const wishlist = await WishlistModel.findById(id);
      if (!wishlist) {
        res.status(404).json({
          success: false,
          message: "Wishlist tidak ditemukan.",
        });
        return;
      }

      // 🔹 Pastikan hanya pemilik atau ADMIN yang bisa update
      if (wishlist.user_id !== userId && userRole !== "ADMIN") {
        res.status(403).json({
          success: false,
          message: "Anda tidak memiliki izin untuk mengubah wishlist ini.",
        });
        return;
      }

      // 🔹 Update wishlist
      const updatedWishlist = await WishlistModel.updateWishlistName(
        id,
        wishlist_name
      );

      res.status(200).json({
        success: true,
        message: "Nama wishlist berhasil diperbarui.",
        data: updatedWishlist,
      });
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal memperbarui nama wishlist.",
        error: error.message,
      });
      return;
    }
  }

  // 📌 Cek apakah destinasi ada di wishlist
  static async checkDestinationInWishlist(req: Request, res: Response) {
    try {
      const { wishlist_id, destination_id } = req.query;

      console.log(wishlist_id, destination_id);

      if (!wishlist_id || !destination_id) {
        res.status(400).json({
          success: false,
          message: "Wishlist ID dan Destination ID wajib diisi.",
        });
        return;
      }

      const exists = await WishlistModel.checkDestinationInWishlist(
        wishlist_id as string,
        destination_id as string
      );

      res.status(200).json({
        success: true,
        message: exists
          ? "Destinasi ada dalam wishlist."
          : "Destinasi tidak ditemukan dalam wishlist.",
        data: { exists },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal mengecek destinasi dalam wishlist.",
        error: error.message,
      });
    }
  }

  // 📌 GET Semua Destinasi dalam Wishlist
  static async getWishlistDestinations(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 🔹 Cek apakah wishlist ada
      const wishlist = await prisma.wishlist.findUnique({
        where: { id },
      });

      if (!wishlist) {
        res.status(404).json({
          success: false,
          message: "Wishlist tidak ditemukan.",
        });
        return;
      }

      const destinations = await WishlistModel.getWishlistDestinations(id);

      res.status(200).json({
        success: true,
        message: "Daftar destinasi dalam wishlist berhasil diambil.",
        data: destinations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil daftar destinasi dalam wishlist.",
        error: error.message,
      });
    }
  }

  // 📌 Hapus semua wishlist milik user (hanya pemilik atau ADMIN yang bisa)
  static async deleteAllWishlistsByUser(req: Request, res: Response) {
    try {
      const { user_id } = req.params;
      const userId = req.user?.user_id; // Ambil user_id dari token
      const userRole = req.user?.role; // Ambil role dari token

      // Cek apakah user yang sedang login adalah ADMIN atau pemilik wishlist
      if (userRole !== "ADMIN" && userId !== user_id) {
        res.status(403).json({
          success: false,
          message: "Anda tidak memiliki izin untuk menghapus wishlist ini.",
        });
        return;
      }

      // 🔹 Cek apakah wishlist ada sebelum menghapus
      const wishlistCount = await prisma.wishlist.count({
        where: { user_id },
      });

      if (wishlistCount === 0) {
        res.status(404).json({
          success: false,
          message: "Wishlist tidak ditemukan.",
        });
        return;
      }

      // 🔹 Hapus semua wishlist milik user
      await WishlistModel.deleteAllWishlistsByUser(user_id);

      res.status(200).json({
        success: true,
        message: "Semua wishlist milik user berhasil dihapus.",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal menghapus semua wishlist milik user.",
        error: error.message,
      });
    }
  }
}
