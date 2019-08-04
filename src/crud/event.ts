import { query, tableValues, tableName } from "../helpers/mysql";
import { Event } from "../interfaces/tables/events";
import { cachedQuery } from "../helpers/cache";
import { CacheCategories } from "../interfaces/enum";
import { addLocationToEvents } from "../helpers/location";

/*
 * Get all security ${tableName("events")} for a user
 */
export const getUserEvents = async (userId: number) => {
  return <Event[]>(
    await query(`SELECT * FROM ${tableName("events")} WHERE userId = ?`, [
      userId
    ])
  );
};

/*
 * Get the 10 most recent security ${tableName("events")} for a user
 */
export const getUserRecentEvents = async (userId: number) => {
  return await addLocationToEvents(<Event[]>(
    await query(
      `SELECT * FROM ${tableName(
        "events"
      )} WHERE userId = ? ORDER BY id DESC LIMIT 10`,
      [userId]
    )
  ));
};

/*
 * Get all security ${tableName("events")} for a user
 */
export const getOrganizationEvents = async (organizationId: number) => {
  return <Event[]>(
    await query(
      `SELECT * FROM ${tableName("events")} WHERE organizationId = ?`,
      [organizationId]
    )
  );
};

/*
 * Get the 10 most recent security ${tableName("events")} for a user
 */
export const getOrganizationRecentEvents = async (organizationId: number) => {
  return await addLocationToEvents(<Event[]>(
    await cachedQuery(
      CacheCategories.ORGANIZATION_RECENT_EVENTS,
      organizationId,
      `SELECT * FROM ${tableName(
        "events"
      )} WHERE organizationId = ? ORDER BY id DESC LIMIT 10`,
      [organizationId]
    )
  ));
};

/*
 * Delete all security ${tableName("events")} for a user
 */
export const deleteAllUserEvents = async (userId: number) => {
  return await query(`DELETE FROM ${tableName("events")} WHERE userId = ?`, [
    userId
  ]);
};
