'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useDashboard } from './DashboardContext';

const FinancialContext = createContext<any>(undefined);

/**
 * Helper function to safely fetch data and handle non-JSON responses.
 * Prevents the application from crashing with "Unexpected token '<'"
 * if the server returns an HTML error page (e.g., 404 or 500).
 */
async function safeFetch(url: string) {
    try {
        const res = await fetch(url);
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
    const [bankAccounts, setBankAccounts] = useState([]);
    const [cards, setCards] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [recordTypes, setRecordTypes] = useState([]);

    // Transactional data states
    const [financialRecords, setFinancialRecords] = useState([]);
    const [installmentPlans, setInstallmentPlans] = useState([]);

    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Wait for the dashboard context to finish loading
        if (dashLoading) return;

        // Ensure we have an active dashboard before fetching scoped data
        if (!activeDashboard) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const dashId = activeDashboard.dashboard_id;

        Promise.all([
            /* ==========================================
               GLOBAL ROUTES
               Resources shared across the user's profile
               ========================================== */
            safeFetch('/api/v1/bank-accounts'),
            safeFetch('/api/v1/cards'),

            /* ==========================================
               DASHBOARD-SCOPED ROUTES
               Resources strictly isolated per workspace
               ========================================== */
            safeFetch(`/api/v1/dashboards/${dashId}/categories`),
            safeFetch(`/api/v1/dashboards/${dashId}/tags`),
            safeFetch(`/api/v1/dashboards/${dashId}/payment-methods`),
            safeFetch(`/api/v1/dashboards/${dashId}/record-types`),
            safeFetch(`/api/v1/dashboards/${dashId}/financial-records`),
            safeFetch(`/api/v1/dashboards/${dashId}/installment-plans`),
        ])
            .then(([
                       banksData,
                       cardsData,
                       catsData,
                       tagsData,
                       paysData,
                       typesData,
                       recordsData,
                       plansData
                   ]) => {
                // Extract the 'data' array from the standardized API envelope { data: [...] }
                // Fallbacks to empty arrays to prevent undefined errors in mapped components
                setBankAccounts(banksData?.data || banksData || []);
                setCards(cardsData?.data || cardsData || []);
                setCategories(catsData?.data || catsData || []);
                setTags(tagsData?.data || tagsData || []);
                setPaymentMethods(paysData?.data || paysData || []);
                setRecordTypes(typesData?.data || typesData || []);
                setFinancialRecords(recordsData?.data || recordsData || []);
                setInstallmentPlans(plansData?.data || plansData || []);

                setLoading(false);
            })
            .catch(err => {
                console.error("Error syncing financial ecosystem:", err);
                setError("Unable to synchronize all financial data.");
                setLoading(false);
            });

    }, [activeDashboard, dashLoading]);

    return (
        <FinancialContext.Provider value={{
            bankAccounts,
            cards,
            categories,
            tags,
            paymentMethods,
            recordTypes,
            financialRecords,
            installmentPlans,
            loading,
            error
        }}>
            {children}
        </FinancialContext.Provider>
    );
}

export const useFinancial = () => useContext(FinancialContext);