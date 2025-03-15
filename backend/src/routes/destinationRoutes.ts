import { Router } from "express";
import {
  getAllDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
} from "../controller/destinationController";
import {
  authenticateUser,
  authorizeAdmin,
  authorizeAllUsers,
} from "../middleware/authMiddleware";
import { uploadImages } from "../middleware/uploadImage";

const router = Router();

router.get("/destinations", authenticateUser, getAllDestinations);
router.get("/destinations/:id", authenticateUser, getDestinationById);

// Route untuk membuat destinasi baru dengan upload multiple images
router.post("/destinations", authenticateUser, uploadImages, createDestination);

// Route untuk update destinasi (termasuk update gambar jika ada)
router.put("/destinations/:id", authenticateUser, uploadImages, updateDestination);
router.delete("/destinations/:id", authenticateUser, authorizeAdmin, deleteDestination);

export default router;
