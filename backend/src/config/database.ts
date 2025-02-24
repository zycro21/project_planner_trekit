import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("✅ Database Connected!");
    } catch (error) {
        console.error("❌ Database Connection Error:", error);
        process.exit(1);
    }
};

export { prisma, connectDB };