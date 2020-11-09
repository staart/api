export interface MailConfig {
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

export interface MailOptions {
  template?: string;
  data?: Record<string, any>;
  noLayout?: boolean;
}
