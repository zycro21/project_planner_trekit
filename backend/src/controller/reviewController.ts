import { Request, Response } from "express";
import { ReviewModel } from "../models/Review";

export class ReviewController {
  // Ambil semua review
  static async getReviews(req: Request, res: Response) {
    try {
      const { destination_id, user_id, min_rating, sort, limit, offset } =
        req.query;

      // Parsing parameter query
      const filters = {
        destination_id: destination_id as string,
        user_id: user_id as string,
        min_rating: min_rating ? parseInt(min_rating as string) : undefined,
        sort: (sort as "ASC" | "DESC") || "DESC",
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };

      const result = await ReviewModel.findAll(filters);

      res.json({
        success: true,
        message: "Data review berhasil diambil",
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        reviews: result.reviews,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil review",
        error: error.message,
      });
    }
  }

  // Ambil satu review berdasarkan ID
  static async getReviewById(req: Request, res: Response) {
    try {
      const { review_id } = req.params;

      if (!review_id) {
        res.status(400).json({
          success: false,
          message: "Review ID wajib diisi.",
        });
        return;
      }

      const review = await ReviewModel.findById(review_id);

      if (!review) {
        res.status(404).json({
          success: false,
          message: "Review tidak ditemukan.",
        });
        return;
      }

      res.json({
        success: true,
        message: "Review berhasil diambil",
        review,
      });
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil review",
        error: error.message,
      });
    }
  }

  // Buat review baru
  static async createReview(req: Request, res: Response) {
    try {
      const { user_id, destination_id, rating, comment } = req.body;

      if (!user_id || !destination_id || rating === undefined) {
        res.status(400).json({
          message: "User ID, Destination ID, dan Rating wajib diisi.",
        });
        return;
      }

      const newReview = await ReviewModel.create({
        user_id,
        destination_id,
        rating,
        comment,
      });

      res.status(201).json(newReview);
      return;
    } catch (error: any) {
      res.status(500).json({
        message: "Gagal menambahkan review",
        error: error.message,
      });
      return;
    }
  }

  // Update review
  static async updateReview(req: Request, res: Response) {
    try {
      const { review_id } = req.params;
      const { rating, comment } = req.body;
      const { user_id, role } = req.user as { user_id: string; role: string }; // Ambil user dari auth middleware

      if (!rating && !comment) {
        res.status(400).json({
          success: false,
          message:
            "Harus ada setidaknya satu kolom yang diupdate (rating atau comment).",
        });
        return;
      }

      // Cek apakah review ada
      const existingReview = await ReviewModel.findById(review_id);
      if (!existingReview) {
        res.status(404).json({
          success: false,
          message: "Review tidak ditemukan.",
        });
        return;
      }

      // Hanya admin atau pemilik review yang bisa update
      if (role !== "admin" && existingReview.user_id !== user_id) {
        res.status(403).json({
          success: false,
          message: "Anda tidak memiliki izin untuk mengupdate review ini.",
        });
        return;
      }

      // Lakukan update
      const updatedReview = await ReviewModel.update(review_id, {
        rating,
        comment,
      });

      res.json({
        success: true,
        message: "Review berhasil diperbarui.",
        updatedReview,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal mengupdate review",
        error: error.message,
      });
    }
  }

  // Hapus review
  static async deleteReview(req: Request, res: Response) {
    try {
      const { review_id } = req.params;
      const { user_id, role } = req.user as { user_id: string; role: string }; // Ambil user dari auth middleware

      // Cek apakah review ada
      const existingReview = await ReviewModel.findById(review_id);
      if (!existingReview) {
        res.status(404).json({
          success: false,
          message: "Review tidak ditemukan.",
        });
        return;
      }

      // Hanya admin atau pemilik review yang bisa hapus
      if (role !== "admin" && existingReview.user_id !== user_id) {
        res.status(403).json({
          success: false,
          message: "Anda tidak memiliki izin untuk menghapus review ini.",
        });
        return;
      }

      await ReviewModel.delete(review_id);

      res.json({
        success: true,
        message: "Review berhasil dihapus.",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal menghapus review",
        error: error.message,
      });
    }
  }

  // Ambil semua review berdasarkan destination_id
  static async getReviewsByDestination(req: Request, res: Response) {
    try {
      const { destination_id } = req.params;
      const { min_rating, sort, limit, offset } = req.query;

      const result = await ReviewModel.findAllDestination({
        destination_id,
        min_rating: min_rating ? parseInt(min_rating as string) : undefined,
        sort: (sort as "ASC" | "DESC") || "DESC",
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(result);
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil review berdasarkan destinasi",
        error: error.message,
      });
      return;
    }
  }

  // Ambil semua review berdasarkan user_id
  static async getReviewsByUser(req: Request, res: Response) {
    try {
      const { user_id } = req.params;
      const { min_rating, sort, limit, offset } = req.query;

      const result = await ReviewModel.findAllUser({
        user_id,
        min_rating: min_rating ? parseInt(min_rating as string) : undefined,
        sort: (sort as "ASC" | "DESC") || "DESC",
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil review berdasarkan user",
        error: error.message,
      });
    }
  }

  // Ambil rata-rata rating berdasarkan destination_id
  static async getAverageRating(req: Request, res: Response) {
    try {
      const { destination_id } = req.params;

      const averageRating = await ReviewModel.getAverageRating(destination_id);

      if (!averageRating) {
        res.status(404).json({
          success: false,
          message: "Tidak ada review untuk destinasi ini.",
        });
        return;
      }

      res.json({
        success: true,
        destination_id,
        average_rating: averageRating,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal menghitung rata-rata rating",
        error: error.message,
      });
    }
  }
}
