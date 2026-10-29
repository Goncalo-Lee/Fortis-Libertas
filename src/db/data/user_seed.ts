// src/db/data/user_seed.ts
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { hashPassword } from "better-auth/crypto";

async function seed() {
    console.log("🌱 A conectar à base de dados MySQL...");

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fortis_libertas',
        port: Number(process.env.DB_PORT) || 3306,
        namedPlaceholders: true,
    });

    try {
        console.log("🚀 A preparar identificadores fixos e entidades...");

        const userId = "01a183f3-c947-77f3-b678-96e46d13f7dc";
        const email = "maria.nova@example.com";
        const accountPkId = "01a183f3-c947-77f3-b678-96e46d13f7dd";
        const dashboardId = "01a183f3-c947-77f3-b678-96e46d13f7de";
        const bankAccountId = "01a183f3-c947-77f3-b678-96e46d13f7df";
        const cardId = randomUUID();
        const recordTypeId = randomUUID();
        const categoryId = randomUUID();
        const tagId = randomUUID();
        const paymentMethodId = "PM-" + Date.now().toString().slice(-13);
        const installmentPlanId = randomUUID();
        const financialRecordId = randomUUID();

        // Gera o hash nativo que o Better Auth valida sem erros
        const passwordHash = await hashPassword("Password!");

        await connection.beginTransaction();

        // ========================================================
        // BLOCO 1: AUTENTICAÇÃO E IDENTIDADE (BETTER AUTH)
        // ========================================================
        console.log("👤 A inserir User e Account no formato nativo...");

        await connection.execute(`
            INSERT INTO user (
                user_id, full_name, user_name, email, email_verified_at, two_factor_enabled, role, created_at, updated_at
            ) VALUES (
                UUID_TO_BIN(:userId), 'Maria Nova Silva', 'maria.nova', :email, NOW(), 0, 'user', NOW(), NOW()
            )
            ON DUPLICATE KEY UPDATE updated_at = NOW()
        `, { userId, email });

        await connection.execute(`
            INSERT INTO account (
                account_id, user_id, account_identifier_id, provider_id, password, created_at, updated_at
            ) VALUES (
                UUID_TO_BIN(:accountPkId), UUID_TO_BIN(:userId), :userId, 'credential', :passwordHash, NOW(), NOW()
            )
            ON DUPLICATE KEY UPDATE 
                account_identifier_id = :userId, 
                password = :passwordHash,
                updated_at = NOW()
        `, { accountPkId, userId, passwordHash });

        await connection.execute(`
            INSERT INTO profile (
                user_id, birth_date, phone, currency, language, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:userId), '1990-05-20', '+351912345678', 'EUR', 'pt-PT', NOW(), NOW()
                     )
                ON DUPLICATE KEY UPDATE updated_at = NOW()
        `, { userId });

        // ========================================================
        // BLOCO 2: WORKSPACE & PERMISSÕES
        // ========================================================
        console.log("🏢 A inserir Dashboard e associação de permissões...");

        await connection.execute(`
            INSERT INTO dashboard (
                dashboard_id, name, is_active, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:dashboardId), 'Finanças da Maria', 1, NOW(), NOW()
                     )
                ON DUPLICATE KEY UPDATE updated_at = NOW()
        `, { dashboardId });

        await connection.execute(`
            INSERT INTO user__dashboard (
                dashboard_id, user_id, role, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:dashboardId), UUID_TO_BIN(:userId), 'owner', NOW(), NOW()
                     )
                ON DUPLICATE KEY UPDATE updated_at = NOW()
        `, { dashboardId, userId });

        // ========================================================
        // BLOCO 3: CONTAS BANCÁRIAS (COM DASHBOARD_ID) & CARTÕES
        // ========================================================
        console.log("🏦 A inserir Conta Bancária e Cartão...");

        await connection.execute(`
            INSERT INTO bank_account (
                bank_account_id, dashboard_id, name, initial_balance, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:bankAccountId), UUID_TO_BIN(:dashboardId), 'Conta à Ordem CGD', 1500.00, NOW(), NOW()
                     )
                ON DUPLICATE KEY UPDATE updated_at = NOW()
        `, { bankAccountId, dashboardId });

        await connection.execute(`
            INSERT INTO bank_account__user (
                bank_id, user_id, role, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:bankAccountId), UUID_TO_BIN(:userId), 'owner', NOW(), NOW()
                     )
                ON DUPLICATE KEY UPDATE updated_at = NOW()
        `, { bankAccountId, userId });

        await connection.execute(`
            INSERT INTO card (
                card_id, bank_id, user_id, cardholder_name, type_card, card_number, expiry_date, cvv, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:cardId), UUID_TO_BIN(:bankAccountId), UUID_TO_BIN(:userId), 'MARIA SILVA', 'debit', '1234567812345678', '2028-12-31', '123', NOW(), NOW()
                     )
        `, { cardId, bankAccountId, userId });

        // ========================================================
        // BLOCO 4: ESTRUTURA FINANCEIRA & TRANSAÇÕES
        // ========================================================
        console.log("🏷️ A criar categorias, tipos de registo e transação inicial...");

        await connection.execute(`
            INSERT INTO record_type (
                record_type_id, dashboard_id, name, description, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:recordTypeId), UUID_TO_BIN(:dashboardId), 'EXPENSE', 'Saídas de dinheiro', NOW(), NOW()
                     )
        `, { recordTypeId, dashboardId });

        await connection.execute(`
            INSERT INTO category (
                category_id, dashboard_id, name, description, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:categoryId), UUID_TO_BIN(:dashboardId), 'Supermercado', 'Compras de mercearia', NOW(), NOW()
                     )
        `, { categoryId, dashboardId });

        await connection.execute(`
            INSERT INTO tag (
                tag_id, dashboard_id, name, description, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:tagId), UUID_TO_BIN(:dashboardId), 'Essencial', 'Despesas obrigatórias', NOW(), NOW()
                     )
        `, { tagId, dashboardId });

        await connection.execute(`
            INSERT INTO payment_method (
                payment_method_id, dashboard_id, card_id, name, description, created_at, updated_at
            ) VALUES (
                         :paymentMethodId, UUID_TO_BIN(:dashboardId), UUID_TO_BIN(:cardId), 'Cartão Débito Principal', 'Pagamentos diários', NOW(), NOW()
                     )
        `, { paymentMethodId, dashboardId, cardId });

        await connection.execute(`
            INSERT INTO installment_plan (
                installment_plan_id, dashboard_id, register_by_id, name, description, total_amount, total_installments, due_date, status, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:installmentPlanId), UUID_TO_BIN(:dashboardId), UUID_TO_BIN(:userId), 'Compra do Computador', 'Descrição do computador', 120.00, 3, '2026-11-25', 'pending', NOW(), NOW()
                     )
        `, { installmentPlanId, dashboardId, userId });

        await connection.execute(`
            INSERT INTO financial_record (
                financial_record_id, dashboard_id, register_by_id, record_type_id, category_id, payment_method_id, installment_plan_id, name, description, price, currency, payment_date, status, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:financialRecordId), UUID_TO_BIN(:dashboardId), UUID_TO_BIN(:userId), UUID_TO_BIN(:recordTypeId), UUID_TO_BIN(:categoryId), :paymentMethodId, UUID_TO_BIN(:installmentPlanId), 'Compras Continente', 'Leite, pão e vegetais', 40.00, 'EUR', NOW(), 'settled', NOW(), NOW()
                     )
        `, { financialRecordId, dashboardId, userId, recordTypeId, categoryId, paymentMethodId, installmentPlanId });

        await connection.commit();
        console.log("✅ Base de dados populada com hash nativo do Better Auth!");
        console.log(`🔑 Login: ${email} | Password: Password!`);

    } catch (error) {
        await connection.rollback();
        console.error("❌ Falha na transação do seed:");
        console.error(error);
    } finally {
        await connection.end();
    }
}

seed();