import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";

/** Tags of an installment plan (M:N). Inherited by the records generated for the plan. */
export const tagInstallmentPlan = mysqlTable("tag__installment_plan", {
    tagId: uuidBinary("tag_id").notNull(),
    installmentPlanId: uuidBinary("installment_plan_id", { length: 36 }).notNull(),
    createdAt: t.timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
}, (table) => [
    t.primaryKey({ columns: [table.tagId, table.installmentPlanId] }),

    t.foreignKey({
        name: "fk_tag_installment_plan_tag",
        columns: [table.tagId],
        foreignColumns: [s.tag.id],
    }).onDelete("cascade"),

    t.foreignKey({
        name: "fk_tag_installment_plan_plan",
        columns: [table.installmentPlanId],
        foreignColumns: [s.installmentPlan.id],
    }).onDelete("cascade"),

    t.index("idx_tag_installment_plan_plan_id").on(table.installmentPlanId),
]);
