import express from "express";
import {
  getAllItineraries,
  getItineraryById,
  createItinerary,
  updateItinerary,
  deleteItinerary,
} from "../controller/itineraryController";

const router = express.Router();

router.get("/itinerary", getAllItineraries);
router.get("/itinerary/:id", getItineraryById);
router.post("/itinerary", createItinerary);
router.put("/itinerary/:id", updateItinerary);
router.delete("/itinerary/:id", deleteItinerary);

export default router;
