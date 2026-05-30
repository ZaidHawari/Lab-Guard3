import pg from "pg"
import dotenv from "dotenv";
dotenv.config();
const {Pool} = pg
export const db = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.NODE_ENV === "test" ? "labguard_test" : process.env.DB_NAME,
    port: 5432
});