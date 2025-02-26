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

const router = Router();

router.get("/destinations", authenticateUser, getAllDestinations);
router.get("/destinations/:id", authenticateUser, getDestinationById);
router.post("/destinations", authenticateUser, createDestination);
router.put("/destinations/:id", authenticateUser, updateDestination);
router.delete("/destinations/:id", authenticateUser, deleteDestination);

export default router;
