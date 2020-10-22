export default () => ({
  email: {
    name: 'Staart',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    from: process.env.EMAIL_FROM,
    password: process.env.EMAIL_PASSWORD,
  },
});
