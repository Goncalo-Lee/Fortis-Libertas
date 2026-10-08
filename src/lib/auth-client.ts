import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
//import * as schema from "@/db/schema";
//import { Resend } from "resend";
//import { ResetPasswordEmail } from "@/components/emails/reset-password";
//import VerificationEmail from "@/components/emails/verification-email";
import { twoFactor } from "better-auth/plugins";
//import { db } from "@/database";
import RESEND_ACCOUNT_EMAIL from "dotenv";

// Initialize Resend client for transactional email delivery
const resend = new Resend(process.env.RESEND_API_KEY as string);

/**
 * Main Better Auth server configuration.
 * Connects the database, auth methods, email triggers, and plugins.
 */
export const auth = betterAuth({
    // ORM adapter: connects Better Auth schema models to MySQL via Drizzle
    database: drizzleAdapter(db, {
        provider: "mysql",
        schema,
    }),

    // Handles user email confirmation flow
    emailVerification: {
        sendOnSignUp: true, // Automatically sends confirmation email on registration
        autoSignInAfterVerification: true, // Creates a session once the link is clicked
        sendVerificationEmail: async ({ user, url }) => {
            console.log("A tentar enviar email para:", user.email);

            // Send branded React verification template via Resend
            const { data, error } = await resend.emails.send({
                from: "Acme <onboarding@resend.dev>",
                to: user.email,
                subject: "Verify your email",
                react: VerificationEmail({ username: user.name, verificationUrl: url }),
            });

            if (error) {
                console.error("ERRO RESEND:", error);
            } else {
                console.log("Email sent successfully!", data);
            }
        },
    },

    // Credentials-based auth (email + password)
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 32,
        // Triggered when a password reset is requested
        sendResetPassword: async ({ user, url }) => {
            await resend.emails.send({
                from: "Acme <onboarding@resend.dev>",
                // TODO: Replace hardcoded email with user.email for production
                to: RESEND_ACCOUNT_EMAIL.toString(), // CHANGE TO YOUR EMAIL FROM RESEND
                subject: "Reset your password",
                react: ResetPasswordEmail({ username: user.name, resetUrl: url, userEmail: user.email }),
            });
        },
        requireEmailVerification: true, // Blocks sign-in until email is verified
        sendVerificationEmail: true,
    },

    // OAuth 2.0 third-party authentication
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },

    appName: "FortisLibertas",

    plugins: [
        // Two-Factor Authentication (TOTP via authenticator apps)
        twoFactor({
            issuer: "Fortis Libertas", // Name shown in the authenticator app (Google Auth, Authy, etc.)
            totpOptions: {
                digits: 6,
                period: 30, // 30-second token rotation
                window: 1,  // Allows ±1 step (30s grace) to handle client/server clock drift
            },
        }),
        // Manages cookie lifecycle automatically within Next.js App Router (headers, responses)
        nextCookies(),
    ],
});