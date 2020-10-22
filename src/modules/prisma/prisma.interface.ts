export type OmitSecrets<T> = Omit<Omit<T, 'password'>, 'twoFactorSecret'>;
