import type { NextRequest } from "next/server";
import {
  getBankAccountMember,
  removeBankAccountMember,
  updateBankAccountMemberRole,
} from "@/db/queries/bank-account-members";
import { requireBankAccountRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent, ok } from "@/lib/api/responses";
import { updateMemberSchema } from "@/lib/api/schemas/member";
import { serializeMember } from "@/lib/api/serializers/member";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ bank_account_id: string; user_id: string }> };

/** PATCH: owner changes a member's role. */
export const PATCH = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const p = await params;
  const id = parseUuid(p.bank_account_id);
  const userId = parseUuid(p.user_id);
  const { session } = await requireBankAccountRole(request, id, "owner");
  const { role } = await parseJson(request, updateMemberSchema);

  await updateBankAccountMemberRole(id, session.user.id, userId, role);

  const member = await getBankAccountMember(id, userId);
  if (!member) throw new ApiError("NOT_FOUND");
  return ok(serializeMember(member));
});

/** DELETE: a member can leave; removing someone else requires owner. */
export const DELETE = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const p = await params;
  const id = parseUuid(p.bank_account_id);
  const userId = parseUuid(p.user_id);
  const { session, role } = await requireBankAccountRole(request, id, "viewer");

  const isSelf = session.user.id.toLowerCase() === userId;
  if (!isSelf && role !== "owner") throw new ApiError("FORBIDDEN");

  await removeBankAccountMember(id, session.user.id, userId);
  return noContent();
});
