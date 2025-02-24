import dotenv from "dotenv";
import http from "http";
import app from "./app";
import { connectDB } from "./config/database";

dotenv.config();

const PORT: number = parseInt(process.env.PORT || "5000", 10);

const startServer = async () => {
    await connectDB(); // Tunggu koneksi database sebelum menjalankan server

    const server = http.createServer(app);

    server.listen(PORT, () => {
        console.log(`🚀 Server Running on http://localhost:${PORT}`);
    });
};

// Jalankan server
startServer();