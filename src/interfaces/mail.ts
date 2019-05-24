export interface Mail {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  message: string;
  altText?: string;
  replyTo?: string;
}
