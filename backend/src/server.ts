import dotenv from 'dotenv';
import http from 'http';
import app from './app'; // Sesuaikan dengan lokasi file `app.ts`

dotenv.config();

const PORT: number = parseInt(process.env.PORT || "5000", 10);

// Create HTTP server
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`🚀 Server Running on http://localhost:${PORT}`);
});
