export interface AddBankAccountMemberInput {
    userId?: string;
    email?: string;
    userName?: string;
    role: "owner" | "editor" | "viewer";
}