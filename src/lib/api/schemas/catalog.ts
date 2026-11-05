import { z } from "zod";

const q = z.string().trim().min(1).max(100).optional();
const sort = z.enum(["name", "-name"]).default("name");

export const listCatalogQuery = z.object({ q, sort });

export const listColorsQuery = z
  .object({
    q,
    sort,
    is_reserved: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    dashboard_id: z.guid().optional(),
    scope: z.enum(["record_type", "category"]).optional(),
  })
  .refine((v) => (v.dashboard_id === undefined) === (v.scope === undefined), {
    message: "dashboard_id and scope must be sent together.",
    path: ["scope"],
  });
