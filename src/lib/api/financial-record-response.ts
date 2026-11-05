import {
  getRecordIncludes,
  getTagsByRecord,
  type FinancialRecordRow,
  type RecordInclude,
} from "@/db/queries/financial-records";
import { getOrCreateProfile } from "@/db/queries/me";
import { createConverter, toDay } from "@/lib/exchange";
import { serializeFinancialRecord } from "./serializers/financial-record";

/**
 * Builds the API representation of a page of financial records: tags, `converted` (into the caller's profile
 * currency) and the `include` summaries. Rates are looked up once per currency and date.
 *
 * @param rate - `payment_date` converts with the rate of each payment date, `current` with the latest rate
 */
export async function presentFinancialRecords(
  rows: FinancialRecordRow[],
  userId: string,
  options: { rate?: "payment_date" | "current"; include?: RecordInclude[] } = {},
) {
  if (rows.length === 0) return [];

  const include = new Set(options.include ?? []);
  const [profile, tags, summaries] = await Promise.all([
    getOrCreateProfile(userId),
    getTagsByRecord(rows.map((r) => r.id)),
    getRecordIncludes(rows, include),
  ]);

  const convert = createConverter(profile.currency);

  return Promise.all(
    rows.map(async (row) => {
      const converted = await convert(
        String(row.price),
        row.currency,
        options.rate === "current" ? "current" : toDay(row.paymentDate),
      );

      return serializeFinancialRecord(row, {
        tags: tags.get(row.id.toLowerCase()) ?? [],
        converted,
        include: include.size
          ? {
              ...(include.has("record_type") ? { recordType: summaries.recordTypes.get(row.recordTypeId.toLowerCase()) } : {}),
              ...(include.has("category") ? { category: summaries.categories.get(row.categoryId.toLowerCase()) } : {}),
              ...(include.has("payment_method")
                ? { paymentMethod: summaries.paymentMethods.get(row.paymentMethodId.toLowerCase()) }
                : {}),
              ...(include.has("installment_plan")
                ? {
                    installmentPlan: row.installmentPlanId
                      ? (summaries.installmentPlans.get(row.installmentPlanId.toLowerCase()) ?? null)
                      : null,
                  }
                : {}),
            }
          : undefined,
      });
    }),
  );
}
