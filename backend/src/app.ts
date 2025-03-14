import express, { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "./config/corsConfig";
import path from "path";
import userRoutes from "./routes/userRoutes";
import destinationRoutes from "./routes/destinationRoutes";
import itineraryRoutes from "./routes/itineraryRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";

const App: Express = express();

// Middleware awal
App.use(cors);
App.use(cookieParser());
App.use(express.json());
App.use(express.urlencoded({ extended: true }));

// Routing Placeholder
// Testing
App.get("/", (req: Request, res: Response) => {
  res.send("Welcome to this API!");
});

App.use("/api/users", userRoutes);
App.use("/api/destinations", destinationRoutes);
App.use("/api/itineraries", itineraryRoutes);
App.use("/api/reviews", reviewRoutes);
App.use("/api/wishlists", wishlistRoutes);

const imagePath = path.resolve(__dirname, "../src/destination_image_save");
console.log("Serving images from:", imagePath);

App.use("/images", express.static(imagePath));


export default App;
