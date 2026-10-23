import { db } from "../..";
import type { Role } from "../dashboards/type";
import type { getMember } from "./read";

/**
 * Transaction client type that Drizzle provides inside a `db.transaction` callback.
 *
 * Lets helper functions such as `lockOwners` accept a `tx` argument
 * typed exactly like the one received in the transaction block.
 */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * An active member row, as returned by `getMember` and `listMembers`.
 *
 * Derived from the query itself, so it cannot drift from the selected columns.
 *
 * @property userId - The member's user ID
 * @property role - The member's role within the dashboard
 * @property createdAt - When the membership was created
 * @property updatedAt - When the membership was last changed
 * @property userName - The member's username
 * @property fullName - The member's display name
 * @property image - The member's avatar URL
 */
export type MemberRow = NonNullable<Awaited<ReturnType<typeof getMember>>>;

export type { Role };
