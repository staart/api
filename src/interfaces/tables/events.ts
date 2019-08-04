import { EventType, Webhooks } from "../enum";
import { GeoLocation } from "../../helpers/location";

export interface Event {
  id?: number;
  userId?: number;
  organizationId?: number;
  type?: EventType | Webhooks;
  data?: string | object;
  ipAddress?: string;
  userAgent?: string;
  date?: Date;
  location?: GeoLocation;
}
