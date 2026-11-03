export interface CreateFinancialRecordInput {
    recordTypeId: string;
    categoryId: string;
    paymentMethodId: string;
    installmentPlanId?: string | null;
    name: string;
    description?: string | null;
    price: string; // decimal string: "40.00"
    currency?: string;
    paymentDate: Date;
    status?: "pending" | "settled" | "cancelled";
    tagIds?: string[];
}

export interface UpdateFinancialRecordInput {
    recordTypeId?: string;
    categoryId?: string;
    paymentMethodId?: string;
    installmentPlanId?: string | null;
    name?: string;
    description?: string | null;
    price?: string;
    currency?: string;
    paymentDate?: Date;
    status?: "pending" | "settled" | "cancelled";
    tagIds?: string[];
}