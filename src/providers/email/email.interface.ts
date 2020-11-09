export interface EmailConfig {
  name: string;
  from: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailOptions {
  template?: string;
  data?: Record<string, any>;
  noLayout?: boolean;
}
