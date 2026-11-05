// src/db/data/user_seed.ts
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";
import { db } from "@/db";
import * as schema from "@/db/schema";

async function seed() {
    console.log("🌱 A preparar seed da Maria Nova com Drizzle ORM...");

    try {
        const userId = "01a183f3-c947-77f3-b678-96e46d13f7dc";
        const email = "maria.nova@example.com";
        const accountPkId = "01a183f3-c947-77f3-b678-96e46d13f7de";
        const dashboardId = "01a183f3-c947-77f3-b678-96e46d13f7de";
        const bankAccountId = "01a183f3-c947-77f3-b678-96e46d13f7df";
        const cardId = randomUUID();
        const recordTypeId = randomUUID();
        const categoryId = randomUUID();
        const tagId = randomUUID();
        const paymentMethodId = randomUUID();
        const installmentPlanId = randomUUID();
        const financialRecordId = randomUUID();

        const passwordHash = await hashPassword("Password!");

        await db.transaction(async (tx) => {
            console.log("🔍 A carregar referências dos catálogos globais...");

            const [eurCurrency] = await tx.select().from(schema.currency).where(eq(schema.currency.code, 'EUR')).limit(1);
            const [ptLanguage] = await tx.select().from(schema.language).where(eq(schema.language.code, 'pt-PT')).limit(1);
            const [defaultIcon] = await tx.select().from(schema.icon).limit(1);
            const colors = await tx.select().from(schema.color).where(eq(schema.color.isReserved, false)).limit(2);

            if (!eurCurrency || !ptLanguage || !defaultIcon || colors.length < 2) {
                throw new Error("Catálogos globais vazios. Corre primeiro o 'bun run db:seed:catalogs'!");
            }

            console.log("📦 A inserir Maria, Conta e Dashboard...");

            // 1. UTILIZADOR & PERFIL
            await tx.insert(schema.user).values({
                id: userId,
                userId: userId,
                userName: "maria.nova",
                fullName: "Maria Nova Silva",
                name: "Maria Nova Silva",
                email: email,
                emailVerifiedAt: new Date(),
                twoFactorEnabled: false,
            });

            await tx.insert(schema.account).values({
                id: accountPkId,
                accountId: userId,
                userId: userId,
                providerId: "credential",
                password: passwordHash,
            });

            await tx.insert(schema.profile).values({
                userId: userId,
                birthDate: new Date("1990-05-20"),
                phone: "+351912345678",
                currencyId: eurCurrency.id,
                languageId: ptLanguage.id,
            });

            // 2. DASHBOARD (Passamos id e dashboardId para prevenir erros de mapeamento)
            await tx.insert(schema.dashboard).values({
                id: dashboardId,
                dashboardId: dashboardId,
                name: "Finanças da Maria",
                isActive: true,
            });

            await tx.insert(schema.userDashboard).values({
                dashboardId: dashboardId,
                userId: userId,
                role: "owner",
            });

            console.log("🏦 A inserir Conta Bancária e Cartão...");

            // 3. CONTA BANCÁRIA
            await tx.insert(schema.bankAccount).values({
                id: bankAccountId,
                bankAccountId: bankAccountId,
                name: "Conta à Ordem CGD",
                initialBalance: "1500.00",
                currencyId: eurCurrency.id,
            });

            await tx.insert(schema.bankAccountUser).values({
                bankId: bankAccountId,
                userId: userId,
                role: "owner",
            });

            await tx.insert(schema.card).values({
                id: cardId,
                cardId: cardId,
                bankId: bankAccountId,
                userId: userId,
                cardholderName: "MARIA SILVA",
                typeCard: "debit",
                cardNumber: "1234567812345678",
                expiryDate: new Date("2028-12-31"),
                cvv: "123",
            });

            console.log("🏷️ A inserir classificações...");

            // 4. CLASSIFICAÇÕES
            await tx.insert(schema.recordType).values({
                id: recordTypeId,
                recordTypeId: recordTypeId,
                dashboardId: dashboardId,
                name: "EXPENSE",
                description: "Saídas de dinheiro",
                colorId: colors[0].id,
                iconId: defaultIcon.id,
                kind: "expense",
            });

            await tx.insert(schema.category).values({
                id: categoryId,
                categoryId: categoryId,
                dashboardId: dashboardId,
                name: "Supermercado",
                description: "Compras de mercearia",
                colorId: colors[1].id,
                iconId: defaultIcon.id,
            });

            await tx.insert(schema.recordTypeCategory).values({
                recordTypeId: recordTypeId,
                categoryId: categoryId,
            });

            await tx.insert(schema.tag).values({
                id: tagId,
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
                id: paymentMethodId,
                paymentMethodId: paymentMethodId,
                dashboardId: dashboardId,
                userId: userId,
                cardId: cardId,
                name: "Cartão Débito Principal",
                description: "Pagamentos diários",
            });

            console.log("💰 A gerar planos e transações...");

            // 5. TRANSAÇÕES
            await tx.insert(schema.installmentPlan).values({
                id: installmentPlanId,
                installmentPlanId: installmentPlanId,
                dashboardId: dashboardId,
                registerById: userId,
                recordTypeId: recordTypeId,
                categoryId: categoryId,
                currencyId: eurCurrency.id,
                totalAmount: "120.00",
                totalInstallments: 3,
                dueDate: new Date("2026-11-25"),
                status: "pending",
                name: "Compra do Computador",
                description: "Descrição do computador",
            });

            await tx.insert(schema.financialRecord).values({
                id: financialRecordId,
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
                currencyId: eurCurrency.id,
                paymentDate: new Date(),
                status: "settled",
            });

            await tx.insert(schema.tagFinancialRecord).values({
                tagId: tagId,
                recordId: financialRecordId,
            });
        });

        console.log("✅ Seed da Maria Nova completo!");
        console.log(`🔑 Login: ${email} | Password: Password!`);

    } catch (error) {
        console.error("❌ Erro ao executar o seed:", error);
        process.exit(1);
    }
}

seed();