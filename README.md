![Staart](https://raw.githubusercontent.com/AnandChowdhary/staart/master/assets/logo.png)

[![Travis CI](https://img.shields.io/travis/AnandChowdhary/staart.svg)](https://travis-ci.org/AnandChowdhary/staart)
[![GitHub](https://img.shields.io/github/license/anandchowdhary/staart.svg)](https://github.com/AnandChowdhary/staart/blob/master/LICENSE)
![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/AnandChowdhary/staart.svg)
![Type definitions](https://img.shields.io/badge/types-TypeScript-blue.svg)
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg)](#contributors)

Staart is a Node.js backend starter for SaaS startups written in TypeScript. It has built-in user management and authentication, billing, organizations, GDPR tools, and more.

## ⭐ Features

|  | |
| ----- | --- |
| 👩‍💻 | Developer utilities |
| 🔐 | Authentication and security |
| 💳 | Organizations, users, and billing |
| 🇪🇺 | GDPR and privacy |

- [x] 👩‍💻 Promise-based utilities, framework agnostic
- [x] 👩‍💻 Helpers for database query, finding users, creating tokens, etc.
- [x] 🔐 JWT-based authentication with email/password and scopes
- [x] 💳 Support for multiple emails per user account
- [x] 🔐 Login with Google
- [x] 👩‍💻 Configuration based on environment variables
- [x] 👩‍💻 TypeScript interfaces for `User`, `HTTPError`, etc.
- [ ] 💳 Organizations, inviting team members with permissions
- [ ] 💳 Stripe for subscriptions, billing, cards, invoices, etc.
- [ ] 🇪🇺 Check for authorized devices when logging in (i.e., "Your devices" with approved fingerprints)
- [ ] 🇪🇺 Check for location with logging in (i.e., "New location" with approved subnets)
- [x] 👩‍💻 MySQL schema matching interfaces
- [x] 🔐 Event logging and history (logins, settings changes, etc.)
- [x] 💳 "Magic wand" for user impersonation by super-admins
- [x] 👩‍💻 Express middleware for token check which returns user
- [ ] 🔐 Support for refresh tokens (i.e., "Keep me logged in for 30 days")
- [ ] 🔐 Two-factor authentication with TOTP (and Twilio?)
- [ ] 🇪🇺 Email preferences (1 = security, 2 = notifications, 3 = promotions, etc.)
- [ ] 👩‍💻 Sending rich HTML transactional emails with SES
- [ ] 🇪🇺 GDPR data export, delete (schedule deletion for 30 days)
- [x] 💳 Store user preferences like language, and prefers-reduced-motion
- [ ] 💳 Organization customization like logo, force 2FA, etc.
- [ ] 💳 Affiliate accounts, dashboard, commissions

## 📄 License

MIT

## 👥 Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://anandchowdhary.com/?utm_source=github&utm_campaign=about-link"><img src="https://avatars3.githubusercontent.com/u/2841780?v=4" width="100px;" alt="Anand Chowdhary"/><br /><sub><b>Anand Chowdhary</b></sub></a><br /><a href="https://github.com/AnandChowdhary/staart/commits?author=AnandChowdhary" title="Code">💻</a> <a href="https://github.com/AnandChowdhary/staart/commits?author=AnandChowdhary" title="Documentation">📖</a> <a href="#design-AnandChowdhary" title="Design">🎨</a></td><td align="center"><a href="http://komiserback@gmail.com"><img src="https://avatars3.githubusercontent.com/u/36298335?v=4" width="100px;" alt="reallinfo"/><br /><sub><b>reallinfo</b></sub></a><br /><a href="#design-reallinfo" title="Design">🎨</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
