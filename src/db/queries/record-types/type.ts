/**
 * Input accepted when creating a new record type.
 *
 * @property name - The display name, unique within the dashboard
 * @property description - Optional free-text description; `null` or omitted stores no description
 */
export type CreateRecordTypeInput = {
  name: string;
  description?: string | null;
};

/**
 * Input accepted when updating an existing record type.
 * Every field is optional; omitted fields are left unchanged.
 *
 * @property name - The new display name, unique within the dashboard
 * @property description - The new description; `null` clears it, `undefined` leaves it unchanged
 */
export type UpdateRecordTypeInput = {
  name?: string;
  description?: string | null;
};
