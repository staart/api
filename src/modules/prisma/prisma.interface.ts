export type Expose<T> = Omit<
  Omit<Omit<T, 'password'>, 'twoFactorSecret'>,
  'token'
>;
