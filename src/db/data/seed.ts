import { drizzle } from "drizzle-orm/mysql2";
import { seed, reset } from "drizzle-seed";
import mysql from "mysql2/promise";
import { getTableColumns, isTable } from "drizzle-orm";

import * as schema from "../schema/index";
import { generateId } from "../types";

const globalUuids = Array.from({ length: 10000 }, () => generateId());

function buildAutoUUIDRefinements(schemaObj: Record<string, any>, f: any) {
    const refinements: Record<string, any> = {};

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
                    values: globalUuids,
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

    const db = drizzle(connection, { schema, mode: "default" });

    console.log("Cleaning the database (removing residual data from previous attempts)...");
    await reset(db, schema as any);

    const MOCK_PASSWORD_HASH = "Password123!";
    const SEED_COUNT = 10;

    const sharedUserIds = Array.from({ length: SEED_COUNT }, () => generateId());

    console.log(`Starting database seeding with ${SEED_COUNT} records per table...`);

    // 1. UPDATED: Using exact singular names as exported in your schema
    const tableCounts = {
        user: SEED_COUNT,
        profile: SEED_COUNT,
        bankAccount: SEED_COUNT,
        account: SEED_COUNT
    };

    await seed(db, schema as any, tableCounts).refine((f) => {
        const autoRefinements = buildAutoUUIDRefinements(schema, f);

        return {
            ...autoRefinements,

            // 2. UPDATED: Match the 'user' table name
            user: {
                columns: {
                    ...(autoRefinements.user?.columns || {}),
                    id: f.valuesFromArray({ values: sharedUserIds, isUnique: true }),
                    password: f.default({ defaultValue: MOCK_PASSWORD_HASH })
                }
            },

            profile: {
                columns: {
                    ...(autoRefinements.profile?.columns || {}),
                    userId: f.valuesFromArray({ values: sharedUserIds, isUnique: true })
                }
            },

            // 3. UPDATED: Match the 'bankAccount' table name
            bankAccount: {
                columns: {
                    ...(autoRefinements.bankAccount?.columns || {}),
                    userId: f.valuesFromArray({ values: sharedUserIds, isUnique: true }),
                    balance: f.int({ minValue: 100, maxValue: 5000 })
                }
            }
        };
    });

    console.log("Database seeded successfully!");

    await connection.end();
}

main().catch((err) => {
    console.error("Fatal error during seeding:", err);
    process.exit(1);
});