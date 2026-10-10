'use server'

import {ContactFormData} from "@/types";
import { z } from 'zod';
import contactSchema from "@/utils/validation/register-contact-schema";

// REGISTER-CONTACT-ACTIONS

export const contactAction = async (formData: ContactFormData) => {
    try {

        const parsedData = contactSchema.parse(formData);

        console.log(parsedData);

        return {
            success: true,
            message: 'Message sent successfully!',
        };
    } catch (error) {
        // ZodError type error handling
        if (error instanceof z.ZodError) {
            const errors = error.issues.map(issue => issue.message);
            return {
                success: false,
                message: errors.join(', '),
            };
        }

        console.error(error);
        return {
            success: false,
            message: 'Failed to send message.',
        };
    }
};