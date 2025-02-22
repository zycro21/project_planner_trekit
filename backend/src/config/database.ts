import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER as string,
    host: process.env.DB_HOST as string,
    database: process.env.DB_NAME as string,
    password: process.env.DB_PASSWORD as string,
    port: Number(process.env.DB_PORT) || 5432,
});

const connectDB = async (): Promise<void> => {
    try {
        const client =  await pool.connect();
        console.log('Database Connected! ✅');
        client.release();
    } catch (error) {
        console.error('Database Connection Error:', error);
    }
};

connectDB();

export default pool;