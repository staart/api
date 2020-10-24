export default () => ({
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  security: {
    saltRounds: process.env.SALT_ROUNDS ?? 10,
    jwtSecret: process.env.JWT_SECRET ?? 'staart',
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY ?? '1h',
    passwordPwnedCheck: !!process.env.PASSWORD_PWNED_CHECK,
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
