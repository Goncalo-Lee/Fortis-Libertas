// src/db/data/seed.ts
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

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
        console.log("🚀 A gerar identificadores e a preparar dados relacionais...");

        // 1. Gerar UUIDs para todas as entidades principais
        const userId = randomUUID();
        const accountPkId = randomUUID();
        const dashboardId = randomUUID();
        const bankAccountId = randomUUID();
        const cardId = randomUUID();
        const recordTypeId = randomUUID();
        const categoryId = randomUUID();
        const tagId = randomUUID();
        const paymentMethodId = "PM-" + Date.now().toString().slice(-13);
        const installmentPlanId = randomUUID();
        const financialRecordId = randomUUID();

        await connection.beginTransaction();
        console.log("📦 A inserir entidades principais (User, Account, Profile, Dashboard)...");

        // ==========================================
        // BLOCO 1: UTILIZADOR, CONTA (AUTH) & WORKSPACE
        // ==========================================
        await connection.execute(`
            INSERT INTO user (
                user_id, user_name, full_name, email, email_verified_at, two_factor_enabled, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:userId), 'maria.silva', 'Maria Silva', 'maria@example.com', NOW(), 0, NOW(), NOW()
                     )
        `, { userId });

        // Inserção da Tabela Account com a password solicitada
        // Nota: Se o teu sistema de Auth (ex: NextAuth/BetterAuth) exigir que a password esteja em hash (bcrypt/argon2) na base de dados,
        // terás de substituir 'Password!' pela respetiva hash gerada, caso contrário o login falhará ao comparar.
// Inserção da Tabela Account com o account_identifier_id incluído
// 1. Gera o hash compatível com o Better Auth usando o Bun
        const hashedPassword = await Bun.password.hash("Password!");

        // 2. Insere na Tabela Account (nota o provider_id como 'credential' no singular)
        await connection.execute(`
            INSERT INTO account (
                account_id, account_identifier_id, user_id, provider_id, password, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:accountPkId), :accountIdentifierId, UUID_TO_BIN(:userId), 'credential', :password, NOW(), NOW()
                     )
        `, {
            accountPkId,
            accountIdentifierId: 'maria@example.com',
            userId,
            password: hashedPassword // Passamos a password criptografada!
        });

        await connection.execute(`
            INSERT INTO profile (
                user_id, birth_date, phone, currency, language, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:userId), '1990-05-20', '+351912345678', 'EUR', 'pt-PT', NOW(), NOW()
                     )
        `, { userId });

        await connection.execute(`
            INSERT INTO dashboard (
                dashboard_id, name, is_active, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:dashboardId), 'Finanças da Maria', 1, NOW(), NOW()
                     )
        `, { dashboardId });

        await connection.execute(`
            INSERT INTO user__dashboard (
                dashboard_id, user_id, role, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:dashboardId), UUID_TO_BIN(:userId), 'owner', NOW(), NOW()
                     )
        `, { dashboardId, userId });

        // ==========================================
        // BLOCO 2: BANCOS & CARTÕES
        // ==========================================
        console.log("🏦 A inserir contas bancárias e cartões...");

        await connection.execute(`
            INSERT INTO bank_account (
                bank_account_id, name, initial_balance, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:bankAccountId), 'Conta à Ordem CGD', 1500.00, NOW(), NOW()
                     )
        `, { bankAccountId });

        await connection.execute(`
            INSERT INTO bank_account__user (
                bank_id, user_id, role, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:bankAccountId), UUID_TO_BIN(:userId), 'owner', NOW(), NOW()
                     )
        `, { bankAccountId, userId });

        await connection.execute(`
            INSERT INTO card (
                card_id, bank_id, user_id, cardholder_name, type_card, card_number, expiry_date, cvv, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:cardId), UUID_TO_BIN(:bankAccountId), UUID_TO_BIN(:userId), 'MARIA SILVA', 'debit', '1234567812345678', '2028-12-31', '123', NOW(), NOW()
                     )
        `, { cardId, bankAccountId, userId });

        // ==========================================
        // BLOCO 3: CLASSIFICAÇÕES & DEFINIÇÕES DO DASHBOARD
        // ==========================================
        console.log("🏷️ A inserir classificações (Tipos, Categorias, Tags, Métodos de Pagamento)...");

        await connection.execute(`
            INSERT INTO record_type (
                record_type_id, dashboard_id, name, description, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:recordTypeId), UUID_TO_BIN(:dashboardId), 'Despesa', 'Saídas de dinheiro', NOW(), NOW()
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
            INSERT INTO tag__category (
                tag_id, category_id, created_at
            ) VALUES (
                         UUID_TO_BIN(:tagId), UUID_TO_BIN(:categoryId), NOW()
                     )
        `, { tagId, categoryId });

        await connection.execute(`
            INSERT INTO payment_method (
                payment_method_id, dashboard_id, card_id, name, description, created_at, updated_at
            ) VALUES (
                         :paymentMethodId, UUID_TO_BIN(:dashboardId), UUID_TO_BIN(:cardId), 'Cartão Débito Principal', 'Pagamentos diários', NOW(), NOW()
                     )
        `, { paymentMethodId, dashboardId, cardId });

        // ==========================================
        // BLOCO 4: TRANSAÇÕES (PLANO DE PRESTAÇÕES & REGISTOS)
        // ==========================================
        console.log("💰 A gerar planos de pagamento e transações financeiras...");

        await connection.execute(`
            INSERT INTO installment_plan (
                installment_plan_id, dashboard_id, register_by_id, total_amount, total_installments, due_date, status, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:installmentPlanId), UUID_TO_BIN(:dashboardId), UUID_TO_BIN(:userId), 120.00, 3, '2026-11-25', 'pending', NOW(), NOW()
                     )
        `, { installmentPlanId, dashboardId, userId });

        await connection.execute(`
            INSERT INTO financial_record (
                financial_record_id, dashboard_id, register_by_id, record_type_id, category_id, payment_method_id, installment_plan_id, name, description, price, currency, payment_date, status, created_at, updated_at
            ) VALUES (
                         UUID_TO_BIN(:financialRecordId), UUID_TO_BIN(:dashboardId), UUID_TO_BIN(:userId), UUID_TO_BIN(:recordTypeId), UUID_TO_BIN(:categoryId), :paymentMethodId, UUID_TO_BIN(:installmentPlanId), 'Compras Continente', 'Leite, pão e vegetais', 40.00, 'EUR', NOW(), 'settled', NOW(), NOW()
                     )
        `, { financialRecordId, dashboardId, userId, recordTypeId, categoryId, paymentMethodId, installmentPlanId });

        await connection.execute(`
            INSERT INTO tag__financial_record (
                tag_id, record_id, created_at
            ) VALUES (
                         UUID_TO_BIN(:tagId), UUID_TO_BIN(:financialRecordId), NOW()
                     )
        `, { tagId, financialRecordId });

        // ==========================================
        // COMMIT DA TRANSAÇÃO
        // ==========================================
        await connection.commit();

        console.log("✅ Seed completo e coerente executado com sucesso!");
        console.log(`👤 Utilizador criado: maria@example.com | Password: Password!`);

    } catch (error) {
        await connection.rollback();
        console.error("❌ Erro ao executar o seed, transação revertida:");
        console.error(error);
    } finally {
        await connection.end();
    }
}

seed();