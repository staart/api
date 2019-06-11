![Staart](https://raw.githubusercontent.com/o15y/staart/master/assets/logo.png)

[![Travis CI](https://img.shields.io/travis/o15y/staart.svg)](https://travis-ci.org/o15y/staart)
![Netlify status](https://img.shields.io/endpoint.svg?url=https://platform.oswaldlabs.com/netlify-status/733928c0-f533-485f-90e9-680be56794a9)
[![Dependencies](https://img.shields.io/david/o15y/staart.svg)](https://github.com/o15y/staart/blob/master/package.json)
[![Contributors](https://img.shields.io/github/contributors/o15y/staart.svg)](https://github.com/o15y/staart/graphs/contributors)
[![GitHub](https://img.shields.io/github/license/o15y/staart.svg)](https://github.com/o15y/staart/blob/master/LICENSE)
![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/o15y/staart.svg)
![Type definitions](https://img.shields.io/badge/types-TypeScript-blue.svg)

Staart is a Node.js backend starter for SaaS startups written in TypeScript. It has built-in user management and authentication, billing, organizations, GDPR tools, and more.

Works with [Staart UI](https://github.com/o15y/staart-ui), the frontend starter for SaaS.

## ⭐ Features

### 🔐 Security

- [x] Authentication and user management with JWT
- [x] Two-factor authentication with TOTP
- [x] Multiple emails per account and Login with Google
- [x] Location-based login verification
- [x] Security event logging and history

### 💳 SaaS

- [x] Subscriptions management with Stripe
- [x] Organizations, teams, and user permissions
- [x] Invoices, billing, credit cards, payments
- [x] Rich HTML transactional emails with SES
- [x] GDPR-proof data export and delete
- [ ] Affiliates and commission management
- [x] API key management with rate limiting

### 👩‍💻 Developer utilities

- [x] Decorators and class syntax with OvernightJS
- [x] Injection-proof helpers for querying databases
- [x] Data pagination and CRUD utilities for all tables
- [x] Authorization helpers (can a user do this?)
- [x] TypeScript interfaces for tables (ORM)
- [x] Caching and invalidation for common queries
- [x] User impersonation for super-admin

## 🛠 Usage

1. Fork this repository
1. Install dependencies with `yarn` or `npm i`
1. Add a `.env` file based on [config.ts](https://github.com/o15y/staart/blob/master/src/config.ts).
1. Create MariaDB/MySQL tables based on [schema.sql](https://github.com/o15y/staart/blob/master/schema.sql)
1. Add your controllers in the `./src/controllers` directory
1. Generate your `app.ts` file using `yarn generate-routes`
1. Build with `yarn build` and deploy with `yarn start`

## 💻 API

Staart comes with tens of helper and CRUD methods for users, organizations, and more.

**[View documentation →](https://staart-docs.o15y.com)**

**[View API demo →](https://staart.caprover.oswaldlabs.com)**

**[View frontend demo →](https://staart-demo.o15y.com)**

## 👥 Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://anandchowdhary.com/?utm_source=github&utm_campaign=about-link"><img src="https://avatars3.githubusercontent.com/u/2841780?v=4" width="100px;" alt="Anand Chowdhary"/><br /><sub><b>Anand Chowdhary</b></sub></a><br /><a href="https://github.com/o15y/staart/commits?author=AnandChowdhary" title="Code">💻</a> <a href="https://github.com/o15y/staart/commits?author=AnandChowdhary" title="Documentation">📖</a> <a href="#design-AnandChowdhary" title="Design">🎨</a></td><td align="center"><a href="http://komiserback@gmail.com"><img src="https://avatars3.githubusercontent.com/u/36298335?v=4" width="100px;" alt="reallinfo"/><br /><sub><b>reallinfo</b></sub></a><br /><a href="#design-reallinfo" title="Design">🎨</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## 📄 License

- Code: [MIT](https://github.com/o15y/staart/blob/master/LICENSE)
- Logo and assets: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
