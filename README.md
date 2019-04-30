![Staart](https://raw.githubusercontent.com/AnandChowdhary/staart/master/assets/logo.png)

[![Travis CI](https://img.shields.io/travis/AnandChowdhary/staart.svg)](https://travis-ci.org/AnandChowdhary/staart)
![Netlify status](https://img.shields.io/endpoint.svg?url=https://platform.oswaldlabs.com/netlify-status/560804f0-60ab-4172-9af8-f38e0dd675f6)
[![GitHub](https://img.shields.io/github/license/anandchowdhary/staart.svg)](https://github.com/AnandChowdhary/staart/blob/master/LICENSE)
![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/AnandChowdhary/staart.svg)
![Type definitions](https://img.shields.io/badge/types-TypeScript-blue.svg)
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg)](#contributors)

Staart is a Node.js backend starter for SaaS startups written in TypeScript. It has built-in user management and authentication, billing, organizations, GDPR tools, and more.

## ⭐ Features

| Emoji | Category |
| ----- | -------- |
| 👩‍💻 | Developer utilities |
| 🔐 | Authentication and security |
| 💳 | Organizations, users, and billing |
| 🇪🇺 | GDPR and privacy |

- [x] 👩‍💻 Helpers for database query, finding users, creating tokens, etc.
- [x] 🔐 JWT-based authentication with email/password and scopes
- [x] 💳 Support for multiple emails per user account
- [x] 🔐 Login with Google
- [x] 👩‍💻 TypeScript interfaces for tables and helpers
- [ ] 💳 Organizations and inviting team members with scopes
- [ ] 💳 Stripe for subscriptions, billing, cards, invoices, etc.
- [ ] 🇪🇺 Check for authorized devices when logging in (i.e., "Your devices" with approved fingerprints)
- [x] 🇪🇺 Check for location with logging in (i.e., "New location" with approved subnets)
- [x] 👩‍💻 Built-in caching and invalidation for common database queries
- [x] 🔐 Event logging and history endpoints (logins, settings changes, etc.)
- [x] 💳 "Magic wand" for user impersonation by super-admins
- [x] 👩‍💻 Express middleware for login token validation
- [x] 🔐 Support for refresh tokens (i.e., "Keep me logged in for 30 days")
- [ ] 🔐 Two-factor authentication with TOTP (and Twilio?)
- [ ] 🇪🇺 Email preferences (1 = security, 2 = notifications, 3 = promotions, etc.)
- [x] 👩‍💻 Sending rich HTML transactional emails with AWS SES
- [ ] 🇪🇺 GDPR data export, delete (schedule deletion for 30 days)
- [ ] 💳 Affiliate accounts, dashboard, commissions

## 🛠 Usage

1. Clone or fork this repository
1. Install dependencies with `yarn` or `npm i`
1. Add a `.env` file based on [config.ts](https://github.com/AnandChowdhary/staart/blob/master/src/config.ts).
1. Create MariaDB/MySQL tables based on [schema.sql](https://github.com/AnandChowdhary/staart/blob/master/schema.sql)
1. Add custom helper methods in the `./src/helpers` folder
1. Add custom services in the `./src/rest` folder using helpers
1. Add custom routes in the `./src/routes` folder with these services
1. Build with `yarn build` and deploy with `pm2 start dist/index.js`

## 💻 API

Staart comes with tens of helper and CRUD methods for users, organizations, and more.

**[View documentation →](https://staart.anandchowdhary.com)**

## 👥 Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://anandchowdhary.com/?utm_source=github&utm_campaign=about-link"><img src="https://avatars3.githubusercontent.com/u/2841780?v=4" width="100px;" alt="Anand Chowdhary"/><br /><sub><b>Anand Chowdhary</b></sub></a><br /><a href="https://github.com/AnandChowdhary/staart/commits?author=AnandChowdhary" title="Code">💻</a> <a href="https://github.com/AnandChowdhary/staart/commits?author=AnandChowdhary" title="Documentation">📖</a> <a href="#design-AnandChowdhary" title="Design">🎨</a></td><td align="center"><a href="http://komiserback@gmail.com"><img src="https://avatars3.githubusercontent.com/u/36298335?v=4" width="100px;" alt="reallinfo"/><br /><sub><b>reallinfo</b></sub></a><br /><a href="#design-reallinfo" title="Design">🎨</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## 📄 License

- Code: [MIT](https://github.com/AnandChowdhary/staart/blob/master/LICENSE)
- Logo and assets: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
