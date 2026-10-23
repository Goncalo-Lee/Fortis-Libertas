import { and, eq, isNull } from "drizzle-orm";
import { db } from "../..";
import { financialRecord, recordType } from "../../schema";
import { generateId } from "../../types";
import { ApiError } from "../../../lib/api/errors";
import { inDashboard, nameTaken } from "./../utils";
import { getRecordType } from "./read";
import { CreateRecordTypeInput, UpdateRecordTypeInput } from "./type";

/* ======
  WRITE
======= */

/**
 * Creates a new record type in a dashboard.
 *
 * Checks that the name is not already used in the dashboard. If two requests pass that check
 * at the same time, the unique index rejects the second insert and this function maps it to the same error.
 *
 * @param dashboardId - The unique identifier of the dashboard that will own the record type
 * @param input - The name and optional description of the new record type
 * @returns The created record type
 * @throws {ApiError} `NAME_ALREADY_EXISTS` if an active record type with the same name already exists in the dashboard
 *
 * @example
 * const recordType = await createRecordType("dash_123", {
 *   name: "Despesas de transporte",
 *   description: "Combustível, portagens e estacionamento",
 * });
 */
export async function createRecordType(dashboardId: string, input: CreateRecordTypeInput) {
  if (await nameTaken({ table: recordType, dashboardId, name: input.name })) {
    throw new ApiError("NAME_ALREADY_EXISTS");
  }

  const id = generateId();
  try {
    await db.insert(recordType).values({
      id,
      dashboardId,
      name: input.name,
      description: input.description ?? null,
    });
  } catch (error) {
    if (await nameTaken({ table: recordType, dashboardId, name: input.name, exceptId: id })) {
      throw new ApiError("NAME_ALREADY_EXISTS");
    }
    throw error;
  }

  return getRecordType(dashboardId, id);
}

/**
 * Updates an existing record type. Only the fields present in `changes` are modified.
 *
 * A name that equals the current name is ignored, so it never triggers the uniqueness check.
 *
 * @param dashboardId - The unique identifier of the dashboard owning the record type
 * @param id - The unique identifier of the record type to update
 * @param changes - The fields to change; `description: null` clears the description
 * @returns The updated record type, or `null` if no active record type matches
 * @throws {ApiError} `NAME_ALREADY_EXISTS` if the new name is already used by another record type in the dashboard
 *
 * @example
 * const updated = await updateRecordType("dash_123", "rt_456", {
 *   name: "Despesas de deslocação",
 *   description: null,
 * });
 */
export async function updateRecordType(
  dashboardId: string,
  id: string,
  changes: UpdateRecordTypeInput,
) {
  const current = await getRecordType(dashboardId, id);
  if (!current) return null;

  const set: Partial<typeof recordType.$inferInsert> = {};
  if (changes.name !== undefined && changes.name !== current.name) set.name = changes.name;
  if (changes.description !== undefined) set.description = changes.description;

  if (set.name !== undefined && (await nameTaken({ table: recordType, dashboardId, name: set.name, exceptId: id }))) {
    throw new ApiError("NAME_ALREADY_EXISTS");
  }

  if (Object.keys(set).length > 0) {
    try {
      await db
        .update(recordType)
        .set({ ...set, updatedAt: new Date() })
        .where(inDashboard(recordType, dashboardId, id));
    } catch (error) {
      if (set.name !== undefined && (await nameTaken({ table: recordType, dashboardId, name: set.name, exceptId: id }))) {
        throw new ApiError("NAME_ALREADY_EXISTS");
      }
      throw error;
    }
  }

  return getRecordType(dashboardId, id);
}

/**
 * Soft-deletes a record type by setting its `deletedAt` timestamp.
 *
 * Emulates `ON DELETE RESTRICT`: a record type that is still used by an active financial record cannot be deleted.
 *
 * @param dashboardId - The unique identifier of the dashboard owning the record type
 * @param id - The unique identifier of the record type to delete
 * @returns Nothing; the record type is marked as deleted in place
 * @throws {ApiError} `IN_USE` if at least one active financial record still references this record type
 *
 * @example
 * try {
 *   await softDeleteRecordType("dash_123", "rt_456");
 * } catch (error) {
 *   if (error instanceof ApiError && error.code === "IN_USE") {
 *     console.log("Record type is still in use and cannot be deleted.");
 *   }
 * }
 */
export async function softDeleteRecordType(dashboardId: string, id: string) {
  const [used] = await db
    .select({ id: financialRecord.id })
    .from(financialRecord)
    .where(and(
      eq(financialRecord.recordTypeId, id),
      isNull(financialRecord.deletedAt),
    ))
    .limit(1);

  if (used) throw new ApiError("IN_USE");

  await db
    .update(recordType)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(inDashboard(recordType, dashboardId, id));
}
