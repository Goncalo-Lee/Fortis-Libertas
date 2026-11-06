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

        // IDs separados para Receita e Despesa
        const expenseTypeId = randomUUID();
        const incomeTypeId = randomUUID();

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
            const reservedColors = await tx.select().from(schema.color).where(eq(schema.color.isReserved, true)).limit(2);
            const otherColors = await tx.select().from(schema.color).where(eq(schema.color.isReserved, false)).limit(3);

            if (!eurCurrency || !ptLanguage || !defaultIcon || reservedColors.length < 2 || otherColors.length < 1) {
                throw new Error("Catálogos globais vazios. Corre primeiro o 'bun run db:seed:catalogs'!");
            }

            console.log("📦 A inserir Maria, Conta e Dashboard...");

            // 1. UTILIZADOR & PERFIL
            await tx.insert(schema.user).values({
                id: userId,
                name: "Maria Nova Silva",
                username: "maria.nova",
                email: email,
                emailVerified: new Date(),
                twoFactorEnabled: false,
            });

            await tx.insert(schema.account).values({
                id: accountPkId,
                userId: userId,
                accountId: userId,
                providerId: "credential",
                password: passwordHash,
            });

            await tx.insert(schema.profile).values({
                userId: userId,
                birthDate: "1990-05-20",
                phone: "+351912345678",
                currencyId: eurCurrency.id,
                languageId: ptLanguage.id,
            });

            // 2. DASHBOARD
            await tx.insert(schema.dashboard).values({
                id: dashboardId,
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
                bankId: bankAccountId,
                userId: userId,
                cardholderName: "MARIA SILVA",
                typeCard: "debit",
                cardNumber: "1234567812345678",
                expiryDate: "2028-12-31",
                cvv: "123",
            });

            console.log("🏷️ A inserir classificações (Receitas e Despesas)...");

            // 4. CLASSIFICAÇÕES: Criamos obrigatoriamente Despesa e Receita
            // Encontrar as cores reservadas específicas
            const expenseColor = reservedColors.find(c => c.name === "Expenses Red") || reservedColors[1];
            const incomeColor = reservedColors.find(c => c.name === "Income Green") || reservedColors[0];

            await tx.insert(schema.recordType).values({
                id: expenseTypeId,
                dashboardId: dashboardId,
                name: "Despesa",
                description: "Saídas de dinheiro",
                colorId: expenseColor.id,
                iconId: defaultIcon.id,
                kind: "expense",
            });

            await tx.insert(schema.recordType).values({
                id: incomeTypeId,
                dashboardId: dashboardId,
                name: "Receita",
                description: "Entradas de dinheiro",
                colorId: incomeColor.id,
                iconId: defaultIcon.id,
                kind: "income",
            });

            await tx.insert(schema.category).values({
                id: categoryId,
                dashboardId: dashboardId,
                name: "Supermercado",
                description: "Compras de mercearia",
                colorId: otherColors[0].id,
                iconId: defaultIcon.id,
            });

            // Associa a categoria aos dois record types para poderes usá-la em ambos
            await tx.insert(schema.recordTypeCategory).values({
                recordTypeId: expenseTypeId,
                categoryId: categoryId,
            });

            await tx.insert(schema.recordTypeCategory).values({
                recordTypeId: incomeTypeId,
                categoryId: categoryId,
            });

            await tx.insert(schema.tag).values({
                id: tagId,
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
                dashboardId: dashboardId,
                userId: userId,
                cardId: cardId,
                name: "Cartão Débito Principal",
                description: "Pagamentos diários com cartão", // IMPORTANTE: description é notNull!
            });

            console.log("💰 A gerar planos e transações...");

            // 5. TRANSAÇÕES
            const emergencyPlanId = randomUUID();
            await tx.insert(schema.installmentPlan).values({
                id: emergencyPlanId,
                dashboardId: dashboardId,
                registerById: userId,
                name: "Fundo de Emergência",
                description: "[EMERGENCY] Custo: 750 | Meses: 6",
                categoryId: categoryId,
                recordTypeId: expenseTypeId,
                currencyId: eurCurrency.id,
                totalAmount: "4500.00",
                totalInstallments: 6,
                dueDate: "2027-05-20",
                status: "pending",
            });

            await tx.insert(schema.installmentPlan).values({
                id: installmentPlanId,
                dashboardId: dashboardId,
                registerById: userId,
                recordTypeId: expenseTypeId,
                categoryId: categoryId,
                currencyId: eurCurrency.id,
                totalAmount: "120.00",
                totalInstallments: 3,
                dueDate: "2026-11-25",
                status: "pending",
                name: "Compra do Computador",
                description: "Computador portátil para trabalho",
            });

            await tx.insert(schema.financialRecord).values({
                id: financialRecordId,
                dashboardId: dashboardId,
                registerById: userId,
                recordTypeId: expenseTypeId,
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

        console.log("✅ Seed da Maria Nova completo e otimizado!");
        console.log(`🔑 Login: ${email} | Password: Password!`);

    } catch (error) {
        console.error("❌ Erro ao executar o seed:", error);
        process.exit(1);
    }
}

seed();