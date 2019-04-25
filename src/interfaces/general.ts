export interface KeyValue {
  [index: string]: any;
}

export interface HTTPError {
  status: number;
  code: string;
  message?: string;
}
