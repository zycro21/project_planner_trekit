import express from "express";
import {
  getAllItineraries,
  getItineraryById,
  createItinerary,
  updateItinerary,
  deleteItinerary,
  addDestinationToItinerary,
  removeDestinationFromItinerary,
  getItinerariesByUserId,
  updateDestinationOrderInItinerary,
} from "../controller/itineraryController";
import {
  authenticateUser,
  authorizeAdmin,
  authorizeAllUsers,
} from "../middleware/authMiddleware";

const router = express.Router();

// Get semua itinerary
router.get("/itinerary", authenticateUser, getAllItineraries);

// Get itinerary by ID
router.get("/itinerary/:id", authenticateUser, getItineraryById);

// Get itineraries by user_id
router.get("/itinerary/user/:user_id", getItinerariesByUserId);

// Buat itinerary baru
router.post("/itinerary", authenticateUser, createItinerary);

// Update itinerary (tanpa mengubah destinasi)
router.put("/itinerary/:id", authenticateUser, updateItinerary);

// Hapus itinerary
router.delete(
  "/itinerary/:id",
  authenticateUser,
  authorizeAdmin,
  deleteItinerary
);

// Tambah destinasi ke itinerary
router.post(
  "/itinerary/:id/destination",
  authenticateUser,
  addDestinationToItinerary
);

// Hapus destinasi dari itinerary
router.delete(
  "/itinerary/:id/destination/:destination_id",
  authenticateUser,
  removeDestinationFromItinerary
);

// Update order_index dan day dalam itinerary
router.put(
  "/itinerary/:id/destination/:destination_id",
  authenticateUser,
  updateDestinationOrderInItinerary
);

export default router;
