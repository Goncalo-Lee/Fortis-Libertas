import * as memberships from "../memberships";

/* ======
  READ
======= */

/** Predicate for an active membership of a user in a dashboard. */
export const activeMember = (dashboardId: string, userId: string) =>
  memberships.activeMember(memberships.dashboardMembership, dashboardId, userId);

/** One active member of a dashboard with the user data joined, or `null`. */
export const getMember = (dashboardId: string, userId: string) =>
  memberships.getMember(memberships.dashboardMembership, dashboardId, userId);

/** Page of active members of a dashboard and the total. */
export const listMembers = (dashboardId: string, limit: number, offset: number) =>
  memberships.listMembers(memberships.dashboardMembership, dashboardId, limit, offset);
