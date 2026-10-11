import { relations } from "drizzle-orm";
import { user } from "./user";
import { session } from "./session";
import { account } from "./account";
import { twoFactor } from "./twoFactor";
import { profile } from "./profile";
import { notifications } from "./notifications";
import { bankAccount } from "./bankAccount";
import { bankAccountUser } from "./bankAccountUser";
import { card } from "./card";
import { dashboard } from "./dashboard";
import { userDashboard } from "./userDashboard";
import { recordType } from "./recordType";
import { category } from "./category";
import { tag } from "./tag";
import { paymentMethod } from "./paymentMethod";
import { installmentPlan } from "./installmentPlan";
import { financialRecord } from "./financialRecord";
import { tagCategory } from "./tagCategory";
import { tagFinancialRecord } from "./tagFinancialRecord";

export const userRelations = relations(user, ({ many }) => ({
  // Links user to one active profile (1:1)
  profile: many(profile),

  // User can have multiple concurrent login sessions (1:N)
  sessions: many(session),

  // User can link multiple OAuth providers (1:N)
  accounts: many(account),

  // 1:1 modeled as 1:N in Drizzle. Enforce logic in app layer.
  twoFactors: many(twoFactor),

  // User notifications inbox (1:N)
  notifications: many(notifications),

  // Shared bank accounts via junction table (M:N)
  bankAccounts: many(bankAccountUser),

  // Shared dashboards via junction table (M:N)
  dashboards: many(userDashboard),

  // Cards owned by the user (1:N)
  cards: many(card),

  // Financial records authored by the user (1:N)
  financialRecords: many(financialRecord),

  // Installment plans created by the user (1:N)
  installmentPlans: many(installmentPlan),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  // Links session back to its owner user
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  // Links OAuth account back to owner user
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  // Links 2FA config back to owner user
  user: one(user, { fields: [twoFactor.userId], references: [user.id] }),
}));

export const profileRelations = relations(profile, ({ one }) => ({
  // Links profile back to user
  user: one(user, { fields: [profile.userId], references: [user.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  // Links notification to receiving user
  user: one(user, { fields: [notifications.userId], references: [user.id] }),
}));

export const bankAccountRelations = relations(bankAccount, ({ many }) => ({
  // Users sharing this bank account
  users: many(bankAccountUser),
  // Cards issued under this bank account
  cards: many(card),
}));

export const bankAccountUserRelations = relations(bankAccountUser, ({ one }) => ({
  // Resolves M:N between bank account and user
  bankAccount: one(bankAccount, { fields: [bankAccountUser.bankId], references: [bankAccount.id] }),
  user: one(user, { fields: [bankAccountUser.userId], references: [user.id] }),
}));

export const cardRelations = relations(card, ({ one, many }) => ({
  // Links card back to issuing bank and owning user
  bankAccount: one(bankAccount, { fields: [card.bankId], references: [bankAccount.id] }),
  user: one(user, { fields: [card.userId], references: [user.id] }),
  paymentMethods: many(paymentMethod),
}));

export const dashboardRelations = relations(dashboard, ({ many }) => ({
  // Workspace relational links (1:N & M:N)
  users: many(userDashboard),
  categories: many(category),
  tags: many(tag),
  recordTypes: many(recordType),
  paymentMethods: many(paymentMethod),
  financialRecords: many(financialRecord),
  installmentPlans: many(installmentPlan),
}));

export const userDashboardRelations = relations(userDashboard, ({ one }) => ({
  // Resolves M:N between dashboard and user
  dashboard: one(dashboard, { fields: [userDashboard.dashboardId], references: [dashboard.id] }),
  user: one(user, { fields: [userDashboard.userId], references: [user.id] }),
}));

export const recordTypeRelations = relations(recordType, ({ one, many }) => ({
  // Associated dashboard and financial records
  dashboard: one(dashboard, { fields: [recordType.dashboardId], references: [dashboard.id] }),
  financialRecords: many(financialRecord),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
  // Category ties to a workspace, records, and M:N tags
  dashboard: one(dashboard, { fields: [category.dashboardId], references: [dashboard.id] }),
  financialRecords: many(financialRecord),
  tags: many(tagCategory),
}));

export const tagRelations = relations(tag, ({ one, many }) => ({
  // Tag ties to workspace and M:N to categories/records
  dashboard: one(dashboard, { fields: [tag.dashboardId], references: [dashboard.id] }),
  categories: many(tagCategory),
  financialRecords: many(tagFinancialRecord),
}));

export const paymentMethodRelations = relations(paymentMethod, ({ one, many }) => ({
  // Links payment method to dashboard, specific card, and records
  dashboard: one(dashboard, { fields: [paymentMethod.dashboardId], references: [dashboard.id] }),
  card: one(card, { fields: [paymentMethod.cardId], references: [card.id] }),
  financialRecords: many(financialRecord),
}));

export const installmentPlanRelations = relations(installmentPlan, ({ one, many }) => ({
  // Links installment plan to dashboard, author, and related records
  dashboard: one(dashboard, { fields: [installmentPlan.dashboardId], references: [dashboard.id] }),
  registerBy: one(user, { fields: [installmentPlan.registerById], references: [user.id] }),
  financialRecords: many(financialRecord),
}));

export const financialRecordRelations = relations(financialRecord, ({ one, many }) => ({
  // Core transaction linkages to dimensions
  dashboard: one(dashboard, { fields: [financialRecord.dashboardId], references: [dashboard.id] }),
  registerBy: one(user, { fields: [financialRecord.registerById], references: [user.id] }),
  recordType: one(recordType, { fields: [financialRecord.recordTypeId], references: [recordType.id] }),
  category: one(category, { fields: [financialRecord.categoryId], references: [category.id] }),
  paymentMethod: one(paymentMethod, { fields: [financialRecord.paymentMethodId], references: [paymentMethod.id] }),
  installmentPlan: one(installmentPlan, { fields: [financialRecord.installmentPlanId], references: [installmentPlan.id] }),
  tags: many(tagFinancialRecord),
}));

export const tagCategoryRelations = relations(tagCategory, ({ one }) => ({
  // Resolves M:N between tag and category
  tag: one(tag, { fields: [tagCategory.tagId], references: [tag.id] }),
  category: one(category, { fields: [tagCategory.categoryId], references: [category.id] }),
}));

export const tagFinancialRecordRelations = relations(tagFinancialRecord, ({ one }) => ({
  // Resolves M:N between tag and financial record
  tag: one(tag, { fields: [tagFinancialRecord.tagId], references: [tag.id] }),
  financialRecord: one(financialRecord, { fields: [tagFinancialRecord.recordId], references: [financialRecord.id] }),
}));