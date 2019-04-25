import { query, tableValues } from "../helpers/mysql";
import { Event } from "../interfaces/tables/events";

export const createEvent = async (event: Event) => {
  if (typeof event.data === "object") event.data = JSON.stringify(event.data);
  event.createdAt = new Date();
  await query(`INSERT INTO events ${tableValues(event)}`, Object.values(event));
};
