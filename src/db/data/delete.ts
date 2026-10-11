import 'dotenv/config';
import mysql from 'mysql2/promise';

if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing.");
    process.exit(1);
}

async function main() {
    const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL,
    });

    console.log("✅ Conexão estabelecida!");

    try {
        // 1. Desativar chaves estrangeiras à força na sessão atual
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

        // 2. Obter o nome de todas as tabelas da base de dados atual
        const [tables] = await connection.query('SHOW TABLES;');

        for (const row of tables as any[]) {
            // O resultado vem num objeto onde o valor é o nome da tabela
            const tableName = Object.values(row)[0];

            // OPÇÃO A: Limpar todos os dados e resetar os IDs (Auto Increment)
            await connection.query(`TRUNCATE TABLE \`${tableName}\`;`);
            console.log(`🧹 Dados limpos da tabela: ${tableName}`);

            // OPÇÃO B: Se quiseres DESTRUIR as tabelas completamente, comenta a linha de cima e usa esta:
            // await connection.query(`DROP TABLE \`${tableName}\`;`);
            // console.log(`🔥 Tabela destruída: ${tableName}`);
        }

        console.log("✅ Operação concluída em todas as tabelas!");

    } catch (error) {
        console.error("❌ Erro ao processar tabelas:", error);
    } finally {
        // 3. Reativar chaves estrangeiras
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
        await connection.end();
    }
}

main();