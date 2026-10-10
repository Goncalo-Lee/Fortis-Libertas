import { z } from 'zod';

const contactSchema = z.object({
    name: z
        .string()
        .trim()
        .min(8)
        .nonempty({ message: 'O nome é obrigatório' })
        .max(20, { message: 'O nome não pode ter mais de 20 caracteres' })
        .regex(/^[a-zA-ZÀ-ÿ\s]+$/, { message: "O nome não pode conter números ou símbolos" }),
    password: z
        .string()
        .trim()
        .min(8, { message: 'A password tem que ter pelo menos 8 caracteres' })
        .max(30, { message: 'A password não pode ter mais de 30 caracteres' })
        .regex(/[A-Z]/, { message: "Tem que ter pelo menos uma caractere maiúsculo" })
        .regex(/[^a-zA-Z0-9]/, { message: "Tem que ter pelo menos um caractere especial" }),
    email: z
        .string()
        .trim()
        .min(1, { message: "O e-mail é obrigatório" })
        .email({ message: "Digite um e-mail válido" }),
    phone : z
        .int()
        .min(9, { message: "O número tem de ter pelo menos 9 dígitos!" })
        .max(15, { message: "O número não pode ter mais de 15 dígitos!" }),
    message: z
        .string().min(1)
})

export default contactSchema;