export type Expose<T> = Omit<Omit<T, 'password'>, 'twoFactorSecret'>;
