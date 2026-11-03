export interface CreateInstallmentPlanInput {
    name: string;
    description?: string | null;
    totalAmount: string; // decimal string
    totalInstallments: number;
    dueDate: string; // YYYY-MM-DD
    status?: "pending" | "settled" | "cancelled";
}

export interface UpdateInstallmentPlanInput {
    name?: string;
    description?: string | null;
    totalAmount?: string;
    totalInstallments?: number;
    dueDate?: string;
    status?: "pending" | "settled" | "cancelled";
}