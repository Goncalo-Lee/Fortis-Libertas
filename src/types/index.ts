export type ContactFormData = {
    name: string;
    email: string;
    message: string;
};

declare global {
    interface Window {
        Tawk_API?: any;
        Tawk_LoadStart?: Date;
    }
}