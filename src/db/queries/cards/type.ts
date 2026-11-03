export interface CreateCardInput {
    bankId: string;
    cardholderName: string;
    typeCard: "debit" | "credit";
    cardNumber: string;
    expiryDate: string; // YYYY-MM-DD
    cvv: string;
}

export interface UpdateCardInput {
    cardholderName?: string;
    typeCard?: "debit" | "credit";
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    bankId?: string;
}