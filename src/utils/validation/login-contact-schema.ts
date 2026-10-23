import { z } from 'zod';

const contactSchema = z.object({
    email: z
        .string()
        .trim()
        .min(6)
        .nonempty({ message: 'O email é obrigatório' })
        .max(50, { message: 'O email não pode ter mais de 20 caracteres' }),
    password: z
        .string()
        .trim()
        .min(6, { message: 'A password tem que ter pelo menos 8 caracteres' })
        .max(40, { message: 'A password não pode ter mais de 30 caracteres' })
        .regex(/[A-Z]/, { message: "Tem que ter pelo menos uma caractere maiúsculo" })
        .regex(/[^a-zA-Z0-9]/, { message: "Tem que ter pelo menos um caractere especial" }),
})

export default contactSchema;