import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import {betterAuth} from "better-auth";
import {twoFactor, username} from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";
import { generateId } from "../db/types";
import {nextCookies} from "better-auth/next-js";
import nodemailer from "nodemailer";
import {error} from "better-auth/api";

/**
 * Better Auth Configuration
 *
 * Centralized authentication service utilizing Better Auth with:
 * - Drizzle ORM MySQL adapter for database operations.
 * - Custom UUIDv7 ID generator ensuring entity primary keys match the project's
 *   `binary(16)` / UUIDv7 architecture defined in the Data Dictionary.
 * - Two-Factor Authentication (`twoFactor`) plugin for multi-factor security.
 *
 * Environment Requirements:
 * - `BETTER_AUTH_SECRET`: Secret key for session/token cryptographic operations.
 * - `BETTER_AUTH_URL`: Canonical base URL of the application.
 * - `DATABASE_URL`: Connection string for the MySQL database.
 */

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  }
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      twoFactor: schema.twoFactor,
    },
  }),

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url }) => {
      await transporter.sendMail({
        from: '"Fortis Libertas" <no-reply@fortislibertas.com>',
        to: user.email,
        subject: "Verifica a tua conta",
        html: `<p>Clica <a href="${url}">aqui</a> para verificar a tua conta.</p>`,
      })

      if (error) {
        console.error(error);
      } else {
        console.log("Email enviado com sucesso!");
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 32,
    requireEmailVerification: true,

    sendResetPassword: async ({ user, url }) => {
      await transporter.sendMail({
        from: '"Fortis Libertas" <no-reply@fortislibertas.com>',
        to: user.email,
        subject: "Reinicia a tua senha",
        html: `<p>Clica <a href="${url}">aqui</a> para reiniciar a tua senha.</p>`,
      })
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  advanced: {
    database: {
      // Enforces application-wide UUIDv7 generation for all Better Auth models
      generateId: () => {
        const novoId = crypto.randomUUID();
        console.log("🚨 BETTER AUTH PEDIU UM ID NOVO! Gerei o UUID:", novoId);
        return novoId;
      },
      joins: true,
    },
  },
  appName: "FortisLibertas",
  plugins: [
    twoFactor({
      issuer: "Fortis Libertas", // Name shown in the authenticator app (Google Auth, Authy, etc.)
      totpOptions: {
        digits: 6,
        period: 30, // 30-second token rotation
        window: 1,  // Allows ±1 step (30s grace) to handle client/server clock drift
      },
    }),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
