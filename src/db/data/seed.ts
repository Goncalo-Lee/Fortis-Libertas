// src/db/data/seed.ts
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db"; // Ajusta para o caminho correto da tua instância DB
import * as schema from "@/db/schema"; // Ajusta para o caminho correto do teu schema Drizzle

async function seed() {
    console.log("🌱 A preparar seed com Drizzle ORM...");

    try {
        // Gera a password com Bun (compatível com Better Auth)
        const hashedPassword = await Bun.password.hash("Password!");

        // 1. Gerar UUIDs para todas as entidades principais
        const userId = randomUUID();
        const accountPkId = randomUUID();
        const dashboardId = randomUUID();
        const bankAccountId = randomUUID();
        const cardId = randomUUID();
        const recordTypeId = randomUUID();
        const categoryId = randomUUID();
        const tagId = randomUUID();
        const paymentMethodId = randomUUID(); // Corrigido para UUID válido
        const installmentPlanId = randomUUID();
        const financialRecordId = randomUUID();

        await db.transaction(async (tx) => {
            console.log("🔍 A carregar referências dos catálogos globais...");

            // Vai buscar as referências obrigatórias geradas pelo db:seed:catalogs
            const [eurCurrency] = await tx.select().from(schema.currency).where(eq(schema.currency.code, 'EUR')).limit(1);
            const [ptLanguage] = await tx.select().from(schema.language).where(eq(schema.language.code, 'pt-PT')).limit(1);
            const [defaultIcon] = await tx.select().from(schema.icon).limit(1);
            // Busca cores distintas para o tipo de registo e categoria
            const colors = await tx.select().from(schema.color).where(eq(schema.color.isReserved, false)).limit(2);

            if (!eurCurrency || !ptLanguage || !defaultIcon || colors.length < 2) {
                throw new Error("Catálogos globais vazios. Corre primeiro o 'bun run db:seed:catalogs'!");
            }

            console.log("📦 A inserir entidades principais (User, Account, Profile, Dashboard)...");

            // ==========================================
            // BLOCO 1: UTILIZADOR, CONTA (AUTH) & WORKSPACE
            // ==========================================
            await tx.insert(schema.user).values({
                id: userId, // Drizzle costuma mapear o PK 'user_id' como 'id'
                userName: "maria.silva",
                fullName: "Maria Silva",
                email: "maria@example.com",
                emailVerifiedAt: new Date(),
                twoFactorEnabled: false,
            });

            await tx.insert(schema.account).values({
                id: accountPkId,
                accountId: "maria@example.com", // Equivalente ao account_identifier_id do Better Auth
                userId: userId,
                providerId: "credential",
                password: hashedPassword,
            });

            await tx.insert(schema.profile).values({
                userId: userId,
                birthDate: new Date("1990-05-20"),
                phone: "+351912345678",
                currencyId: eurCurrency.currencyId, // Usa a FK obrigatória
                languageId: ptLanguage.languageId,  // Usa a FK obrigatória
            });

            await tx.insert(schema.dashboard).values({
                dashboardId: dashboardId,
                name: "Finanças da Maria",
                isActive: true,
            });

            await tx.insert(schema.userDashboard).values({
                dashboardId: dashboardId,
                userId: userId,
                role: "owner",
            });

            // ==========================================
            // BLOCO 2: BANCOS & CARTÕES
            // ==========================================
            console.log("🏦 A inserir contas bancárias e cartões...");

            await tx.insert(schema.bankAccount).values({
                bankAccountId: bankAccountId,
                name: "Conta à Ordem CGD",
                initialBalance: "1500.00",
                currencyId: eurCurrency.currencyId, // FK obrigatória
            });

            await tx.insert(schema.bankAccountUser).values({
                bankId: bankAccountId,
                userId: userId,
                role: "owner",
            });

            await tx.insert(schema.card).values({
                cardId: cardId,
                bankId: bankAccountId,
                userId: userId,
                cardholderName: "MARIA SILVA",
                typeCard: "debit",
                cardNumber: "1234567812345678",
                expiryDate: new Date("2028-12-31"),
                cvv: "123",
            });

            // ==========================================
            // BLOCO 3: CLASSIFICAÇÕES & DEFINIÇÕES
            // ==========================================
            console.log("🏷️ A inserir classificações...");

            await tx.insert(schema.recordType).values({
                recordTypeId: recordTypeId,
                dashboardId: dashboardId,
                name: "Despesa",
                description: "Saídas de dinheiro",
                colorId: colors[0].colorId, // FK obrigatória
                iconId: defaultIcon.id, // FK obrigatória
                kind: "expense", // FK obrigatória ('income', 'expense' ou 'neutral')
            });

            await tx.insert(schema.category).values({
                categoryId: categoryId,
                dashboardId: dashboardId,
                name: "Supermercado",
                description: "Compras de mercearia",
                colorId: colors[1].colorId, // Cores exclusivas por dashboard
                iconId: defaultIcon.id,
            });

            // A nova arquitetura exige que associes a categoria ao tipo de registo!
            await tx.insert(schema.recordTypeCategory).values({
                recordTypeId: recordTypeId,
                categoryId: categoryId,
            });

            await tx.insert(schema.tag).values({
                tagId: tagId,
                dashboardId: dashboardId,
                name: "Essencial",
                description: "Despesas obrigatórias",
            });

            await tx.insert(schema.tagCategory).values({
                tagId: tagId,
                categoryId: categoryId,
            });

            await tx.insert(schema.paymentMethod).values({
                paymentMethodId: paymentMethodId,
                dashboardId: dashboardId,
                userId: userId,
                cardId: cardId,
                name: "Cartão Débito Principal",
                description: "Pagamentos diários",
            });

            // ==========================================
            // BLOCO 4: TRANSAÇÕES
            // ==========================================
            console.log("💰 A gerar planos de pagamento e transações...");

            await tx.insert(schema.installmentPlan).values({
                installmentPlanId: installmentPlanId,
                dashboardId: dashboardId,
                registerById: userId,
                recordTypeId: recordTypeId,
                categoryId: categoryId,
                currencyId: eurCurrency.id, // FK obrigatória
                totalAmount: "120.00",
                totalInstallments: 3,
                dueDate: new Date("2026-11-25"),
                status: "pending",
                name: "Pagamento parcelado",
            });

            await tx.insert(schema.financialRecord).values({
                financialRecordId: financialRecordId,
                dashboardId: dashboardId,
                registerById: userId,
                recordTypeId: recordTypeId,
                categoryId: categoryId,
                paymentMethodId: paymentMethodId,
                installmentPlanId: installmentPlanId,
                name: "Compras Continente",
                description: "Leite, pão e vegetais",
                price: "40.00",
                currencyId: eurCurrency.id, // FK obrigatória
                paymentDate: new Date(),
                status: "settled",
            });

            await tx.insert(schema.tagFinancialRecord).values({
                tagId: tagId,
                recordId: financialRecordId,
            });
        });

        console.log("✅ Seed Drizzle completo e coerente executado com sucesso!");
        console.log("👤 Utilizador criado: maria@example.com | Password: Password!");

    } catch (error) {
        console.error("❌ Erro ao executar o seed:", error);
        process.exit(1);
    }
}

seed();