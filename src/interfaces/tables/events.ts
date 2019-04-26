import { EventType } from "../enum";

export interface Event {
  id?: number;
  userId?: number;
  type?: EventType;
  data?: string | object;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}
