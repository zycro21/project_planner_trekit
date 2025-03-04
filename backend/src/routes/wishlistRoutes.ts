import express from "express";
import { WishlistController } from "../controller/wishlistController";
import {
  authenticateUser,
  authorizeAdmin,
  authorizeAllUsers,
} from "../middleware/authMiddleware";

const router = express.Router();

// 📌 Membuat wishlist baru dengan minimal 1 destinasi (menerima `destination_ids[]`)
router.post("/wishlist/create", authenticateUser, WishlistController.createWishlist);

// 📌 Menambahkan satu atau lebih destinasi ke wishlist yang sudah ada
router.post(
  "/wishlist/add-destinations",
  authenticateUser,
  WishlistController.addDestinationsToWishlist
);

// 📌 Menghapus satu atau lebih destinasi dari wishlist
router.delete(
  "/wishlist/remove-destinations",
  authenticateUser,
  WishlistController.removeDestinationsFromWishlist
);

// 📌 Menghapus wishlist beserta semua relasinya
router.delete("/wishlist/:id", authenticateUser, WishlistController.deleteWishlist);

// 📌 GET Semua Wishlist
router.get("/wishlists", authenticateUser, WishlistController.getAllWishlists);

// 📌 GET Wishlist berdasarkan ID
router.get("/wishlist/:id", WishlistController.getWishlistById);

// 📌 GET Wishlist berdasarkan User ID
router.get("/wishlist/user/:user_id", WishlistController.getWishlistsByUser);

// 📌 Update nama wishlist
router.patch("/wishlist/:id", WishlistController.updateWishlistName);

// 📌 Cek apakah destinasi ada di wishlist
router.get("/wishlist/check", WishlistController.checkDestinationInWishlist);

// 📌 GET Semua Destinasi dalam Wishlist
router.get(
  "/wishlist/:id/destinations",
  WishlistController.getWishlistDestinations
);

// 📌 Hapus semua wishlist milik user
router.delete(
  "/wishlist/user/:user_id",
  WishlistController.deleteAllWishlistsByUser
);

export default router;