import {
  DOMAIN_VERIFICATION_HTML,
  DOMAIN_VERIFICATION_TXT,
} from './domains.constants';

export type DomainVerificationMethods =
  | typeof DOMAIN_VERIFICATION_TXT
  | typeof DOMAIN_VERIFICATION_HTML;
