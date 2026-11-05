import type { financialRecord } from "@/db/schema";

/** Dimension that the summary report groups records by. */
export type ReportGroupBy = "record_type" | "category" | "tag" | "payment_method" | "month";

/** A status of `Financial_Record`, taken from the schema so both stay in sync. */
export type RecordStatus = (typeof financialRecord.status.enumValues)[number];

export type SummaryReportOptions = {
  from: Date;
  to: Date;
  groupBy: ReportGroupBy;
  statuses: RecordStatus[];
  /** Currency code of the result (e.g. "EUR"). Amounts in other currencies are converted into it. */
  currency: string;
  /** Rate used to convert: the one of each record's payment date, or the latest one. */
  rate: "payment_date" | "current";
};

/** One row as it comes from the database: the sum of one group, in one currency, on one day. */
export type GroupRow = {
  key: string;
  label: string;
  currency: string;
  day: string;
  total: string;
  count: number;
};

/** Response of GET /dashboards/{dashboard_id}/reports/summary (endpoints.md, section 16.3). */
export type SummaryReport = {
  period: { from: string; to: string };
  currency: string;
  groups: { key: string; label: string; total: string; count: number }[];
  total: string;
};
