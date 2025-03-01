import express, { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "./config/corsConfig";
import path from "path";
import userRoutes from "./routes/userRoutes";
import destinationRoutes from "./routes/destinationRoutes";
import itineraryRoutes from "./routes/itineraryRoutes";
import reviewRoutes from "./routes/reviewRoutes";

const App: Express = express();

// Middleware awal
App.use(cors);
App.use(cookieParser());
App.use(express.json());
App.use(express.urlencoded({ extended: true}));

// Routing Placeholder
// Testing
App.get('/', (req: Request, res: Response) => {
    res.send('Welcome to this API!');
});

App.use("/api/users", userRoutes);
App.use("/api/destinations", destinationRoutes);
App.use("/api/itineraries", itineraryRoutes);
App.use("/api/reviews", reviewRoutes);

App.use("/images", express.static(path.resolve(__dirname, "../destination_image_save")));

export default App;