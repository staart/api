export type Expose<T> = Omit<
  Omit<
    Omit<Omit<Omit<T, 'password'>, 'twoFactorSecret'>, 'token'>,
    'emailSafe'
  >,
  'subnet'
>;
