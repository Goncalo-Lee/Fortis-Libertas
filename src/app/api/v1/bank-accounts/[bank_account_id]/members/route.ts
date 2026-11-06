import type { NextRequest } from "next/server";
import { addBankAccountMember, getBankAccountMember, listBankAccountMembers } from "@/db/queries/bank-account-members";
import { requireBankAccountRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { parsePagination } from "@/lib/api/pagination";
import { created, paginated } from "@/lib/api/responses";
import { addMemberSchema } from "@/lib/api/schemas/member";
import { serializeMember } from "@/lib/api/serializers/member";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ bank_account_id: string }> };

/** GET /bank-accounts/{id}/members: any member can see the roster. */
export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const id = parseUuid((await params).bank_account_id);
  const { session } = await requireBankAccountRole(request, id, "viewer");
  const { page, perPage, offset } = parsePagination(request.nextUrl.searchParams);

  const all = await listBankAccountMembers(id, session.user.id);
  return paginated(all.slice(offset, offset + perPage).map(serializeMember), {
    page,
    perPage,
    total: all.length,
  });
});

/** POST /bank-accounts/{id}/members: owner only; the user is given by id, email or user name. */
export const POST = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const id = parseUuid((await params).bank_account_id);
  const { session } = await requireBankAccountRole(request, id, "owner");
  const input = await parseJson(request, addMemberSchema);

  let target;
  try {
    target = await addBankAccountMember(id, session.user.id, {
      userId: input.user_id?.toLowerCase(),
      email: input.email,
      userName: input.user_name,
      role: input.role,
    });
  } catch (e) {
    if (e instanceof ApiError && e.code === "NOT_FOUND") {
      const pointer = input.user_id ? "/user_id" : input.email ? "/email" : "/user_name";
      throw new ApiError("VALIDATION_ERROR", "User not found.", [{ pointer, message: "No active user found." }]);
    }
    throw e;
  }

  const member = await getBankAccountMember(id, target.userId);
  if (!member) throw new ApiError("INTERNAL_ERROR");

  return created(serializeMember(member), `/api/v1/bank-accounts/${id}/members/${target.userId}`);
});
