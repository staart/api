import { EventType } from "../enum";
import { CityResponse } from "maxmind";

export interface Event {
  id?: number;
  userId?: number;
  organizationId?: number;
  type?: EventType;
  data?: string | object;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  location?: CityResponse | null;
}
