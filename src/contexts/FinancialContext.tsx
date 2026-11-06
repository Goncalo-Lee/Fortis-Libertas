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
    const [globalColors, setGlobalColors] = useState<any[]>([]);
    const [globalIcons, setGlobalIcons] = useState<any[]>([]);
    const [dashboardBalance, setDashboardBalance] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = () => setRefreshKey(prev => prev + 1);

    useEffect(() => {
        if (dashLoading) return;
        if (!activeDashboard) return setLoading(false);

        setLoading(true);
        const dashId = activeDashboard.dashboard_id;

        async function fetchEcosystem() {
            try {
                const [
                    banksData, catsData, tagsData, paysData,
                    typesData, recordsData, balanceData,
                    colorsData, iconsData
                ] = await Promise.all([
                    safeFetch('/api/v1/bank-accounts?per_page=100'),
                    safeFetch(`/api/v1/dashboards/${dashId}/categories?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/tags?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/payment-methods?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/record-types?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/financial-records?per_page=100`),
                    safeFetch(`/api/v1/dashboards/${dashId}/balance`),
                    safeFetch('/api/v1/colors?per_page=100'),
                    safeFetch('/api/v1/icons?per_page=100')
                ]);

                const fetchedTypes = typesData?.data || typesData || [];
                setRecordTypes(fetchedTypes);

                // PRÉ-PROCESSAMENTO DOS REGISTOS: Mastiga os dados para os componentes visuais não terem de o fazer!
                const rawRecords = recordsData?.data || recordsData || [];
                const enrichedRecords = rawRecords.map((record: any) => {
                    const rtId = record.record_type_id || record.recordTypeId;
                    const rt = fetchedTypes.find((t: any) => (t.record_type_id || t.id) === rtId);

                    const kind = (rt?.kind || "").toLowerCase();
                    const isIncome = kind === "income" || (rt?.name || "").toLowerCase().includes("receita");
                    const isExpense = kind === "expense" || (rt?.name || "").toLowerCase().includes("despesa");

                    return {
                        ...record,
                        isIncome,
                        isExpense,
                        amount: Number(record.price || 0), // Preço limpo numérico
                        date: record.payment_date || record.paymentDate // Data limpa
                    };
                });

                setFinancialRecords(enrichedRecords);
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

    const addFinancialRecord = async (payload: any) => {
        if (!activeDashboard?.dashboard_id) throw new Error("Sem dashboard ativo.");

        // Transformação limpa para o formato esperado pela API (snake_case)
        const apiPayload = {
            name: payload.name,
            description: payload.description || null,
            price: Number(payload.price).toFixed(2),
            record_type_id: payload.recordTypeId,
            category_id: payload.categoryId,
            payment_method_id: payload.paymentMethodId,
            status: "paid",
            payment_date: payload.paymentDate || new Date().toISOString(),
            tag_ids: payload.tagIds || []
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
    };

    // Saldo com base nos registos enriquecidos
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
            balance, bankAccounts, categories, tags, paymentMethods, recordTypes, financialRecords,
            globalColors, globalIcons, loading, error, refresh, addFinancialRecord
        }}>
            {children}
        </FinancialContext.Provider>
    );
}

export const useFinancial = () => {
    const context = useContext(FinancialContext);
    if (!context) throw new Error("useFinancial error");
    return context;
};