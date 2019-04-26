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
}
