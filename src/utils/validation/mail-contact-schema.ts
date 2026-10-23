import { z } from 'zod';

const contactSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, { message: "O e-mail é obrigatório" })
        .email({ message: "Digite um e-mail válido" })
})

export default contactSchema;