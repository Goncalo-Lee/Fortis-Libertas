import { drizzle } from "drizzle-orm/mysql2";
import { seed, reset } from "drizzle-seed";
import mysql from "mysql2/promise";
import { getTableColumns, isTable } from "drizzle-orm";

// 1. IMPORTAÇÃO ÚNICA (O index já traz as tabelas e as relações)
import * as schema from "../schema/index";
import { generateId } from "../types";

/**
 * Automatically scans the ENTIRE schema for custom binary(16) UUID columns
 * and maps them to our valid UUIDv7 generator.
 */
function buildAutoUUIDRefinements(schemaObj: Record<string, any>, f: any) {
    const refinements: Record<string, any> = {};
    const validUuids = Array.from({ length: 10000 }, () => generateId());

    for (const [key, entity] of Object.entries(schemaObj)) {
        if (!isTable(entity)) continue;

        const columns = getTableColumns(entity);
        const columnRefinements: Record<string, any> = {};

        for (const [colName, colDef] of Object.entries(columns)) {
            const isForeignKey = colName.endsWith("Id") && colName !== "id";

            if (
                colDef.primary &&
                !isForeignKey &&
                colDef.columnType === 'MySqlCustomColumn' &&
                colDef.getSQLType() === 'binary(16)'
            ) {
                columnRefinements[colName] = f.valuesFromArray({
                    values: validUuids,
                    isUnique: true
                });
            }
        }

        if (Object.keys(columnRefinements).length > 0) {
            refinements[key] = { columns: columnRefinements };
        }
    }

    return refinements;
}

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("ERROR: DATABASE_URL is missing in environment variables.");
        process.exit(1);
    }

    const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL,
    });

    // 2. Passa o schema limpo, que agora já contém tudo
    const db = drizzle(connection, { schema, mode: "default" });

    console.log("A limpar a base de dados (dados residuais de tentativas anteriores)...");
    await reset(db, schema as any);

    console.log("Iniciando o povoamento da base de dados com 10 registos...");

    // 3. Define count: 10 e remove as injeções manuais de 1:1,
    // confiando apenas nas relations definidas no schema.
    await seed(db, schema as any, { count: 10 }).refine((f) => {
        return buildAutoUUIDRefinements(schema, f);
    });

    console.log("Base de dados povoada com sucesso!");

    await connection.end();
}

main().catch((err) => {
    console.error("Erro fatal durante o seed:", err);
    process.exit(1);
});