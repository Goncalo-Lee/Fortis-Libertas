import * as memberships from "../memberships";
import type { Role } from "./type";

/* =======
  WRITE
======== */

/** Adds a member to a dashboard, or reactivates a removed one. `ALREADY_MEMBER` if already active. */
export const addMember = (dashboardId: string, userId: string, role: Role) =>
  memberships.addMember(memberships.dashboardMembership, dashboardId, userId, role);

/** Changes a member's role. `NOT_FOUND` if not a member, `LAST_OWNER` if it would demote the last owner. */
export const changeMemberRole = (dashboardId: string, userId: string, role: Role) =>
  memberships.changeMemberRole(memberships.dashboardMembership, dashboardId, userId, role);

/** Removes a member (soft delete). `NOT_FOUND` if not a member, `LAST_OWNER` if it is the last owner. */
export const removeMember = (dashboardId: string, userId: string) =>
  memberships.removeMember(memberships.dashboardMembership, dashboardId, userId);
