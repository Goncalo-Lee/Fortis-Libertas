import { Role } from "../type";

export interface AddBankAccountMemberInput {
    userId?: string;
    email?: string;
    userName?: string;
    role: Role;
}
