import Stripe from "stripe";

export interface KeyValue {
  [index: string]: any;
}

export interface HTTPError {
  status: number;
  code: string;
  message?: string;
}

export interface Locals {
  userAgent: string;
  ipAddress: string;
  referrer?: string;
}

export interface StripeLocals extends Locals {
  stripeEvent: Stripe.Event;
}

export interface Row {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IdRow extends Row {
  id?: string;
}

export interface Event {
  date?: Date;
  ipAddress?: string;
  userAgent?: string;
  groupId?: number | string;
  userId?: number | string;
  type?: string;
  data?: any;
}
