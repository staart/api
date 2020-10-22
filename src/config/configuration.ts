export default () => ({
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
