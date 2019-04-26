import { query, tableValues } from "../helpers/mysql";
import { Event } from "../interfaces/tables/events";
import { Locals } from "../interfaces/general";

export const createEvent = async (event: Event, locals?: Locals) => {
  if (typeof event.data === "object") event.data = JSON.stringify(event.data);
  event.createdAt = new Date();
  if (locals) {
    event.ipAddress = locals.ipAddress;
    event.userAgent = locals.userAgent;
  }
  await query(`INSERT INTO events ${tableValues(event)}`, Object.values(event));
};
