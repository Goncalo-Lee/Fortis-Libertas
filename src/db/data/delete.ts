import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../schema";
import mysql from 'mysql2/promise';

if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing.");
    process.exit(1);
}


async function main() {

    const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL,
    });

    const db = drizzle({client : connection});

    console.log("✅ Database connection successful!");


    // DELETE THE TABLES
    await db.delete(schema.user);


    console.log("Data on the user table deleted with success!!!");
    await connection.end();
}
main();