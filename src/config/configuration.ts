export default () => ({
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  meta: {
    totpServiceName: process.env.TOPT_SERVICE_NAME ?? 'Staart',
  },
  caching: {
    geolocationLruSize: process.env.GEOLOCATION_LRU_SIZE ?? 100,
  },
  security: {
    saltRounds: process.env.SALT_ROUNDS ?? 10,
    jwtSecret: process.env.JWT_SECRET ?? 'staart',
    totpWindowPast: process.env.TOTP_WINDOW_PAST ?? 1,
    totpWindowFuture: process.env.TOTP_WINDOW_PAST ?? 0,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY ?? '1h',
    passwordPwnedCheck: !!process.env.PASSWORD_PWNED_CHECK,
    unusedRefreshTokenExpiryDays: process.env.DELETE_EXPIRED_SESSIONS ?? 30,
  },
  email: {
    name: process.env.EMAIL_NAME ?? 'Staart',
    from: process.env.EMAIL_FROM,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: !!process.env.EMAIL_SECURE,
    auth: {
      user: process.env.EMAIL_USER ?? process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
  },
});
