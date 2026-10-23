import { z } from 'zod';

const contactSchema = z.object({
    password: z
        .string()
        .trim()
        .min(8, { message: 'A password tem que ter pelo menos 8 caracteres' })
        .max(30, { message: 'A password não pode ter mais de 30 caracteres' })
        .regex(/[A-Z]/, { message: "Tem que ter pelo menos uma caractere maiúsculo" })
        .regex(/[^a-zA-Z0-9]/, { message: "Tem que ter pelo menos um caractere especial" }),
    confirmPassword: z
        .string()
        .trim()
        .min(8, { message: 'A password tem que ter pelo menos 8 caracteres' })
        .max(30, { message: 'A password não pode ter mais de 30 caracteres' })
        .regex(/[A-Z]/, { message: "Tem que ter pelo menos uma caractere maiúsculo" })
        .regex(/[^a-zA-Z0-9]/, { message: "Tem que ter pelo menos um caractere especial" }),
})

export default contactSchema;