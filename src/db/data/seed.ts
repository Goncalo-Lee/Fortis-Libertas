import { drizzle } from "drizzle-orm/mysql2";
import { seed } from "drizzle-seed";
import * as schema from "../schema";
import mysql from "mysql2/promise";



async function main() {
    const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL,
    });

    const db = drizzle({client : connection});

    if (!process.env.DATABASE_URL) {
        console.error("ERROR: DATABASE_URL is missing.");
        process.exit(1);
    }

    // Seeding the tables
    // Se adicionares um terceiro parametro em chave "{ quantidade }", ele vai seedar para cada tabela essa quantidade
    await seed(db, {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        twoFactor: schema.twoFactor,
    }, {count:50});


    console.log("Base de dados povoada com sucesso!");

    await connection.end();
}

main();