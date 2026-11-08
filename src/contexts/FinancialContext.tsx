'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useDashboard } from './DashboardContext';

const FinancialContext = createContext<any>(undefined);

async function safeFetch(url: string) {
    try {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        return null;
    }
}

export function FinancialProvider({ children }: { children: ReactNode }) {
    const { activeDashboard, loading: dashLoading } = useDashboard();

    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [recordTypes, setRecordTypes] = useState<any[]>([]);
    const [financialRecords, setFinancialRecords] = useState<any[]>([]);
    const [installmentPlans, setInstallmentPlans] = useState<any[]>([]);
    const [globalColors, setGlobalColors] = useState<any[]>([]);
    const [globalIcons, setGlobalIcons] = useState<any[]>([]);
    const [dashboardBalance, setDashboardBalance] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = () => setRefreshKey(prev => prev + 1);

    useEffect(() => {
        if (dashLoading) return;
        if (!activeDashboard) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const dashId = activeDashboard.dashboard_id;

        async function fetchEcosystem() {
            try {
                const [
                    banksData, catsData, tagsData, paysData,
                    typesData, recordsData, plansData, balanceData,
                    colorsData, iconsData
                ] = await Promise.all([
                    safeFetch('/api/v1/bank-accounts?per_page=100'),
                    safeFetch(`/api/v1/dashboards/${dashId}/categories?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/tags?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/payment-methods?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/record-types?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/financial-records?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/installment-plans?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/balance`),
                    safeFetch('/api/v1/colors?per_page=100'),
                    safeFetch('/api/v1/icons?per_page=100')
                ]);

                const fetchedTypes = typesData?.data || typesData || [];
                setRecordTypes(fetchedTypes);

                const rawRecords = recordsData?.data || recordsData || [];
                const enrichedRecords = rawRecords.map((record: any) => {
                    const rtId = record.record_type_id || record.recordTypeId;
                    const rt = fetchedTypes.find((t: any) => (t.record_type_id || t.id) === rtId);
                    const kind = (rt?.kind || "").toLowerCase();

                    return {
                        ...record,
                        isIncome: kind === "income" || (rt?.name || "").toLowerCase().includes("receita"),
                        isExpense: kind === "expense" || (rt?.name || "").toLowerCase().includes("despesa"),
                        amount: Number(record.price || 0),
                        date: record.payment_date || record.paymentDate
                    };
                });

                setFinancialRecords(enrichedRecords);
                setInstallmentPlans(plansData?.data || []);
                setBankAccounts(banksData?.data || []);
                setCategories(catsData?.data || []);
                setTags(tagsData?.data || []);
                setPaymentMethods(paysData?.data || []);
                setDashboardBalance(balanceData?.data?.balance !== undefined ? Number(balanceData.data.balance) : null);
                setGlobalColors(colorsData?.data || []);
                setGlobalIcons(iconsData?.data || []);
            } catch (err) {
                setError("Falha ao sincronizar dados.");
            } finally {
                setLoading(false);
            }
        }
        fetchEcosystem();
    }, [activeDashboard, dashLoading, refreshKey]);

    // =====================================
    // REGISTOS FINANCEIROS
    // =====================================
    async function addFinancialRecord(payload: any) {
        if (!activeDashboard?.dashboard_id) throw new Error("Sem dashboard ativo.");

        const apiPayload = {
            name: payload.name,
            description: payload.description || null,
            // A MAGIA ESTÁ AQUI: Blindado para não dar erro 422!
            price: String(Number(payload.price).toFixed(2)),
            record_type_id: payload.recordTypeId,
            category_id: payload.categoryId,
            payment_method_id: payload.paymentMethodId,
            status: "paid",
            payment_date: payload.paymentDate || new Date().toISOString(),
            tag_ids: payload.tagIds || [],
            installment_plan_id: payload.installmentPlanId || payload.installment_plan_id
        };

        const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/financial-records`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(apiPayload)
        });

        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.detail || errJson.message || "Erro ao gravar registo financeiro.");
        }
        refresh();
        return await res.json();
    }

    async function deleteFinancialRecord(id: string) {
        if (!activeDashboard?.dashboard_id) throw new Error("Sem dashboard ativo.");
        const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/financial-records/${id}`, {
            method: "DELETE",
            credentials: "include"
        });
        if (!res.ok) throw new Error("Falha ao eliminar registo");
        refresh();
    }

    // =====================================
    // PLANOS / METAS / FUNDOS (NOVO)
    // =====================================
    async function addInstallmentPlan(payload: any) {
        if (!activeDashboard?.dashboard_id) throw new Error("Sem dashboard ativo.");
        const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || err.message || "Falha ao criar plano.");
        }
        refresh();
        return await res.json();
    }

    async function deleteInstallmentPlan(id: string) {
        if (!activeDashboard?.dashboard_id) throw new Error("Sem dashboard ativo.");
        const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans/${id}`, {
            method: "DELETE",
            credentials: "include"
        });
        if (!res.ok) throw new Error("Falha ao eliminar plano.");
        refresh();
    }


    async function updateInstallmentPlan(id: string, payload: any) {
        if (!activeDashboard?.dashboard_id) throw new Error("Sem dashboard ativo.");
        const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/installment-plans/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Falha ao atualizar plano.");
        refresh();
        return await res.json();
    }

    // =====================================
    // CATEGORIAS & TAGS
    // =====================================
    async function deleteCategory(categoryId: string) {
        if (!activeDashboard?.dashboard_id) throw new Error("Sem dashboard ativo.");
        const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/categories/${categoryId}`, {
            method: "DELETE",
            credentials: "include"
        });
        if (!res.ok) throw new Error("Falha ao eliminar categoria");
        refresh();
    }

    async function addTag(name: string) {
        if (!activeDashboard?.dashboard_id) throw new Error("Sem dashboard ativo.");
        const res = await fetch(`/api/v1/dashboards/${activeDashboard.dashboard_id}/tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name, description: `Tag ${name}` })
        });
        if (!res.ok) throw new Error("Falha ao criar tag");
        refresh();
        return await res.json();
    }

    const balance = useMemo(() => {
        const totalBanks = bankAccounts.reduce((acc, account) => acc + Number(account.initialBalance ?? account.initial_balance ?? 0), 0);
        if (dashboardBalance !== null) return totalBanks + dashboardBalance;
        if (!financialRecords.length) return totalBanks;

        const totalRecords = financialRecords.reduce((acc, record) => {
            if (record.status && record.status !== 'paid' && record.status !== 'settled') return acc;
            if (record.isExpense) return acc - Math.abs(record.amount);
            if (record.isIncome) return acc + Math.abs(record.amount);
            return acc;
        }, 0);

        return totalBanks + totalRecords;
    }, [dashboardBalance, financialRecords, bankAccounts]);

    return (
        <FinancialContext.Provider value={{
            balance, bankAccounts, categories, tags, paymentMethods, recordTypes, financialRecords, installmentPlans,
            globalColors, globalIcons, loading, error,
            refresh,
            addFinancialRecord,
            deleteFinancialRecord,
            addInstallmentPlan,
            deleteInstallmentPlan,
            updateInstallmentPlan,
            deleteCategory,
            addTag
        }}>
            {children}
        </FinancialContext.Provider>
    );
}

export const useFinancial = () => {
    const context = useContext(FinancialContext);
    if (!context) throw new Error("useFinancial deve ser usado dentro do FinancialProvider");
    return context;
};