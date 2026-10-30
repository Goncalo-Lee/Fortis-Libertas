export interface CreateBankAccountInput {
    name: string;
    initialBalance: string; // decimal string
}

export interface UpdateBankAccountInput {
    name?: string;
    initialBalance?: string;
}

export interface BankAccountFilter {
    frozen?: boolean;
    q?: string;
}