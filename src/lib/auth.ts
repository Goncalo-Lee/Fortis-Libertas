import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth} from "better-auth";
import {admin, bearer, twoFactor} from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "../db/schema";
import { generateId } from "@/db/types";
import {nextCookies} from "better-auth/next-js";
import nodemailer from "nodemailer";
import ResetPasswordEmail from "@/emails/reset-password";
import { render } from "@react-email/render";
import {user} from "../db/schema";
import VerificationEmail from "@/emails/verification-email";

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
      const emailHtml = await render(
          VerificationEmail({
            verificationUrl: url,
            username: user.name
          })
      )
      if (process.env.SEEDING === "true") {
        console.log(`Bypassing email verification for: ${user.email}`);
        return;
      }

      try {
        await transporter.sendMail({
          from: '"Fortis Libertas" <no-reply@fortislibertas.com>',
          to: user.email,
          subject: "Verificação de Email - Fortis Libertas", // Tornámos mais genérico
          html: emailHtml,
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
      const emailHtml = await render(
          ResetPasswordEmail({
            resetUrl: url,
            userEmail: user.email,
            username: user.name,
          })
      )

      transporter.sendMail({
        from: '"Fortis Libertas" <no-reply@fortislibertas.com>',
        to: user.email,
        subject: "Reinicia a tua senha",
        html: emailHtml,
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
