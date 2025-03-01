import { Request, Response } from "express";
import { WishlistModel } from "../models/Wishlist";

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

      await WishlistModel.addDestinationsToWishlist(
        wishlist_id,
        destination_ids
      );

      res.status(200).json({
        success: true,
        message: "Destinasi berhasil ditambahkan ke wishlist.",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal menambahkan destinasi ke wishlist.",
        error: error.message,
      });
    }
  }

  // 📌 Mengambil semua wishlist
  static async getAllWishlists(req: Request, res: Response) {
    try {
      const wishlists = await WishlistModel.findAll();

      res.json({
        success: true,
        message: "Data wishlist berhasil diambil.",
        total: wishlists.length,
        data: wishlists,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil semua wishlist.",
        error: error.message,
      });
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

  // 📌 Menghapus satu atau lebih destinasi dari wishlist
  static async removeDestinationsFromWishlist(req: Request, res: Response) {
    try {
      const { wishlist_id, destination_ids } = req.body;

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

      await WishlistModel.removeDestinationsFromWishlist(
        wishlist_id,
        destination_ids
      );

      res.json({
        success: true,
        message: "Destinasi berhasil dihapus dari wishlist.",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal menghapus destinasi dari wishlist.",
        error: error.message,
      });
    }
  }

  // 📌 Menghapus wishlist berdasarkan ID (termasuk semua relasinya)
  static async deleteWishlist(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Wishlist ID wajib diisi.",
        });
        return;
      }

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

      if (!wishlist_name) {
        res.status(400).json({
          success: false,
          message: "Nama wishlist wajib diisi.",
        });
        return;
      }

      const updatedWishlist = await WishlistModel.updateWishlistName(
        id,
        wishlist_name
      );

      res.status(200).json({
        success: true,
        message: "Nama wishlist berhasil diperbarui.",
        data: updatedWishlist,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal memperbarui nama wishlist.",
        error: error.message,
      });
    }
  }

  // 📌 Cek apakah destinasi ada di wishlist
  static async checkDestinationInWishlist(req: Request, res: Response) {
    try {
      const { wishlist_id, destination_id } = req.query;

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

  // 📌 Hapus semua wishlist milik user
  static async deleteAllWishlistsByUser(req: Request, res: Response) {
    try {
      const { user_id } = req.params;

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
