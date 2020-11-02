import {
  DOMAIN_VERIFICATION_TXT,
  DOMAIN_VERIFICATION_HTML,
} from './domains.constants';

export type DomainVerificationMethods =
  | typeof DOMAIN_VERIFICATION_TXT
  | typeof DOMAIN_VERIFICATION_HTML;
