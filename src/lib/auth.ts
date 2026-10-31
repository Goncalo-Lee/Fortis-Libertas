import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth} from "better-auth";
import {admin, bearer, twoFactor} from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "../db/schema";
import { generateId } from "@/db/types";
import {nextCookies} from "better-auth/next-js";
import nodemailer from "nodemailer";

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
    sendOnSignUp: false,
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url }) => {
      if (process.env.SEEDING === "true") {
        console.log(`Bypassing email verification for: ${user.email}`);
        return;
      }

      try {
        await transporter.sendMail({
          from: '"Fortis Libertas" <no-reply@fortislibertas.com>',
          to: user.email,
          subject: "Verificação de Email - Fortis Libertas", // Tornámos mais genérico
          html: `<p>Olá ${user.name},</p><p>Clica <a href="${url}">aqui</a> para verificar e confirmar o teu endereço de email.</p>`,
        });

        console.log(`Email de verificação enviado com sucesso para ${user.email}!`);
      } catch (err) {
        console.error("Falha ao enviar o email de verificação:", err);
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 32,
    requireEmailVerification: false,

    sendResetPassword: async ({ user, url }) => {
      await transporter.sendMail({
        from: '"Fortis Libertas" <no-reply@fortislibertas.com>',
        to: user.email,
        subject: "Reinicia a tua senha",
        html: `<p>Clica <a href="${url}">aqui</a> para reiniciar a tua senha.</p>`,
      })
    },
  },
  user: {
    additionalFields: {
      suspendedAt: { type: "date", required: false, input: false },
      deletedAt: { type: "date", required: false, input: false},
    },
    changeEmail: {
      enabled: true,
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "/dashboard",
      errorCallbackURL: "/sign-in",
    },
  },
  advanced: {
    database: {
      // Enforces application-wide UUIDv7 generation for all Better Auth models
      generateId: () => generateId(),
      joins: false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          await db.insert(schema.profile).values({
            userId: createdUser.id,
          })
        }
      },
    },
  },
  appName: "FortisLibertas",
  plugins: [
      bearer(),
    twoFactor({
      issuer: "Fortis Libertas", // Name shown in the authenticator app (Google Auth, Authy, etc.)
      totpOptions: {
        digits: 6,
        period: 30, // 30-second token rotation
        window: 1,  // Allows ±1 step (30s grace) to handle client/server clock drift
      },
    }),
      admin(),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
