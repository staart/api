import { EventType } from "../enum";

export interface Event {
  id?: number;
  userId?: number;
  type?: EventType;
  data?: string | object;
  createdAt?: Date;
}
