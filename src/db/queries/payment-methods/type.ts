export interface CreatePaymentMethodInput {
    name: string;
    description?: string | null;
    cardId?: string | null;
}

export interface UpdatePaymentMethodInput {
    name?: string;
    description?: string | null;
    cardId?: string | null;
}
