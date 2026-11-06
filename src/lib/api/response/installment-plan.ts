import type { InstallmentPlanRow } from "@/db/queries/installment-plans";
import { getOrCreateProfile } from "@/db/queries/me";
import { createConverter, todayUtc, type Converted } from "@/lib/exchange";

/**
 * `converted` of the `total_amount` of each plan, in the caller's profile currency (`null` when the currency is
 * the same or no rate is available).
 *
 * A plan has no payment date: `payment_date` uses the rate of its `due_date`, or the latest rate when that day is
 * still ahead; `current` always uses the latest rate.
 */
export async function convertPlanTotals(
  rows: InstallmentPlanRow[],
  userId: string,
  rate: "payment_date" | "current" = "payment_date",
): Promise<(Converted | null)[]> {
  if (rows.length === 0) return [];

  const profile = await getOrCreateProfile(userId);
  const convert = createConverter(profile.currency);
  const today = todayUtc();

  return Promise.all(
    rows.map((row) =>
      convert(String(row.totalAmount), row.currency, rate === "current" || row.dueDate >= today ? "current" : row.dueDate),
    ),
  );
}
