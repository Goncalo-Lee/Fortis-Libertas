'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useDashboard } from './DashboardContext';

const FinancialContext = createContext<any>(undefined);

async function safeFetch(url: string) {
    try {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) {
            console.error(`Fetch failed for ${url}: Status ${res.status} (${res.statusText})`);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error(`Network or parsing error when calling ${url}:`, err);
        return null;
    }
}

export function FinancialProvider({ children }: { children: ReactNode }) {
    const { activeDashboard, loading: dashLoading } = useDashboard();

    // Reference data states
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [cards, setCards] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [recordTypes, setRecordTypes] = useState<any[]>([]);

    // Transactional data states
    const [financialRecords, setFinancialRecords] = useState<any[]>([]);
    const [installmentPlans, setInstallmentPlans] = useState<any[]>([]);
    const [dashboardBalance, setDashboardBalance] = useState<number | null>(null);

    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ==========================================
    // REFRESH MECHANISM
    // ==========================================
    const [refreshKey, setRefreshKey] = useState(0);
    const refresh = () => setRefreshKey(prev => prev + 1);

    useEffect(() => {
        if (dashLoading) return;

        if (!activeDashboard) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const dashId = activeDashboard.dashboard_id;

        async function fetchEcosystem() {
            try {
                // Adicionámos per_page=100 para trazer os catálogos completos e include nos registos
                const [
                    banksData,
                    cardsData,
                    catsData,
                    tagsData,
                    paysData,
                    typesData,
                    recordsData,
                    plansData,
                    balanceData
                ] = await Promise.all([
                    safeFetch('/api/v1/bank-accounts?per_page=100'),
                    safeFetch('/api/v1/cards?per_page=100'),
                    safeFetch(`/api/v1/dashboards/${dashId}/categories?per_page=100&include=tags`),
                    safeFetch(`/api/v1/dashboards/${dashId}/tags?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/payment-methods?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/record-types?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/financial-records?per_page=100&include=record_type,category,payment_method,installment_plan`),
                    safeFetch(`/api/v1/dashboards/${dashId}/installment-plans?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/balance`),
                ]);

                // Nota: Removemos o auto-provisioning porque a nova API exige color_id e icon_id,
                // e já cria automaticamente Income, Expenses e Investment ao criar um Dashboard.
                setBankAccounts(banksData?.data || []);
                setCards(cardsData?.data || []);
                setCategories(catsData?.data || []);
                setTags(tagsData?.data || []);
                setPaymentMethods(paysData?.data || []);
                setRecordTypes(typesData?.data || []);
                setFinancialRecords(recordsData?.data || []);
                setInstallmentPlans(plansData?.data || []);

                if (balanceData?.data?.balance !== undefined) {
                    setDashboardBalance(Number(balanceData.data.balance));
                } else {
                    setDashboardBalance(null);
                }

            } catch (err) {
                console.error("Error syncing financial ecosystem:", err);
                setError("Unable to synchronize all financial data.");
            } finally {
                setLoading(false);
            }
        }

        fetchEcosystem();

    }, [activeDashboard, dashLoading, refreshKey]);

    // ==========================================
    // FUNÇÃO PARA ADICIONAR REGISTOS
    // ==========================================
    const addFinancialRecord = async (recordData: {
        name: string;
        description?: string | null;
        price: number | string;
        recordTypeName?: "INCOME" | "EXPENSE" | "NEUTRAL";
        recordTypeId?: string;
        categoryId: string;
        paymentMethodId: string;
        currency?: string;
        status?: "active" | "settled" | "cancelled" | "pending" | "paid" | "late";
        paymentDate?: string;
        tagIds?: string[];
    }) => {
        if (!activeDashboard?.dashboard_id) throw new Error("Sem dashboard ativo.");

        let resolvedRecordTypeId = recordData.recordTypeId;

        if (!resolvedRecordTypeId && recordData.recordTypeName) {
            const desiredKind = recordData.recordTypeName.toLowerCase(); // 'income' | 'expense' | 'neutral'

            // 1. Procura pelo campo oficial `kind` da nova API ('income', 'expense', 'neutral')
            let targetType = recordTypes.find((rt: any) => rt.kind === desiredKind);

            // 2. Fallback por nome (cobre "Expenses", "Expense", "Despesa", "Income", "Receita")
            if (!targetType) {
                targetType = recordTypes.find((rt: any) => {
                    const n = (rt.name || "").toUpperCase();
                    if (desiredKind === "expense") return n.includes("EXPENSE") || n.includes("DESPESA");
                    if (desiredKind === "income") return n.includes("INCOME") || n.includes("RECEITA");
                    return n === recordData.recordTypeName?.toUpperCase();
                });
            }

            if (!targetType) {
                throw new Error(`Tipo de registo '${recordData.recordTypeName}' não encontrado neste dashboard.`);
            }
            resolvedRecordTypeId = targetType.record_type_id || targetType.id;
        }

        // A API exige que `price` seja uma decimal string com até 2 casas decimais (ex: "40.00")
        const formattedPrice = Number(recordData.price).toFixed(2);

        const payload: Record<string, any> = {
            name: recordData.name,
            description: recordData.description ?? null,
            price: formattedPrice,
            record_type_id: resolvedRecordTypeId,
            category_id: recordData.categoryId,
            payment_method_id: recordData.paymentMethodId,
            installment_plan_id: null,
            status: recordData.status || "paid",
            payment_date: recordData.paymentDate || new Date().toISOString(),
        };

        if (recordData.currency) payload.currency = recordData.currency;
        if (recordData.tagIds && recordData.tagIds.length > 0) payload.tag_ids = recordData.tagIds;

        const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/financial-records`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            // A nova API usa RFC 9457 (detail / errors)
            const detailMsg = errJson.detail || errJson.title || errJson.message || "Erro ao gravar registo financeiro.";
            throw new Error(detailMsg);
        }

        refresh();
        return await res.json();
    };

    /* ==========================================
       DERIVED STATE (CALCULATIONS)
       ========================================== */
    const balance = useMemo(() => {
        // 1. Somamos o saldo inicial de todas as contas bancárias
        const totalBanks = bankAccounts.reduce((acc, account) => {
            const initial = account.initialBalance ?? account.initial_balance ?? 0;
            return acc + Number(initial);
        }, 0);

        // 2. Se o endpoint oficial /balance respondeu, usamos o cashflow do servidor + saldo dos bancos
        if (dashboardBalance !== null) {
            return totalBanks + dashboardBalance;
        }

        // 3. Fallback: Se não houver registos e o servidor falhar, devolve só o dinheiro dos bancos
        if (!financialRecords.length) return totalBanks;

        // 4. Fallback local respeitando as regras da nova API
        const totalRecords = financialRecords.reduce((acc, record) => {
            if (record.status !== 'paid' && record.status !== 'settled') {
                return acc;
            }

            const amount = Number(record.converted?.amount ?? record.price ?? 0);
            const rtId = record.record_type_id || record.recordTypeId;
            const rt = recordTypes.find((t: any) => (t.record_type_id || t.id) === rtId);

            const kind = rt?.kind || record.record_type?.kind;

            if (kind === 'expense') return acc - Math.abs(amount);
            if (kind === 'income') return acc + Math.abs(amount);
            return acc;
        }, 0);

        return totalBanks + totalRecords;
    }, [dashboardBalance, financialRecords, recordTypes, bankAccounts]);
    

    return (
        <FinancialContext.Provider value={{
            balance,
            bankAccounts,
            cards,
            categories,
            tags,
            paymentMethods,
            recordTypes,
            financialRecords,
            installmentPlans,
            loading,
            error,
            refresh,
            addFinancialRecord
        }}>
            {children}
        </FinancialContext.Provider>
    );
}

export const useFinancial = () => {
    const context = useContext(FinancialContext);
    if (!context) throw new Error("useFinancial tem de ser usado dentro de um FinancialProvider");
    return context;
};