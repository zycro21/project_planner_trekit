import { Router } from "express";
import { ReviewController } from "../controller/reviewController";
import {
  authenticateUser,
  authorizeAdmin,
  authorizeAllUsers,
} from "../middleware/authMiddleware";

const router = Router();

// Membuat review baru
router.post("/review", authenticateUser, ReviewController.createReview);
router.get(
  "/reviews",
  authenticateUser,
  authorizeAdmin,
  ReviewController.getReviews
);
router.get("/:review_id", authenticateUser, ReviewController.getReviewById);
router.put("/:review_id", authenticateUser, ReviewController.updateReview);
router.delete("/:review_id", authenticateUser, ReviewController.deleteReview);
router.get("/review/:destination_id", ReviewController.getReviewsByDestination);
router.get("/review/:user_id", authenticateUser, ReviewController.getReviewsByUser);
router.get("/review/:destination_id/average-rating", ReviewController.getAverageRating);

export default router;
