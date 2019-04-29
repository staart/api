# 🏁 Staart
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors)

Staart is a Node.js backend starter for SaaS startups written in TypeScript. It has built-in user management and authentication, billing, organizations, GDPR tools, and more.

## ⭐ Features

|  | |
| ----- | --- |
| 👩‍💻 | Developer utilities |
| 🔐 | Authentication and security |
| 💳 | Organizations, users, and billing |
| 🇪🇺 | GDPR and privacy |

- [ ] 👩‍💻 Promise-based utilities, framework agnostic
- [ ] 👩‍💻 Helpers for database query, finding users, creating tokens, etc.
- [ ] 🔐 JWT-based authentication with email/password and scopes
- [ ] 💳 Support for multiple emails per user account
- [ ] 🔐 Login with Google (and Facebook?)
- [ ] 👩‍💻 Configuration based on environment variables
- [ ] 👩‍💻 TypeScript interfaces for `User`, `HTTPError`, etc.
- [ ] 💳 Organizations, inviting team members with permissions
- [ ] 💳 Stripe for subscriptions, billing, cards, invoices, etc.
- [ ] 🇪🇺 Check for authorized devices when logging in (i.e., "Your devices" with approved fingerprints)
- [ ] 🇪🇺 Check for location with logging in (i.e., "New location" with approved subnets)
- [ ] 👩‍💻 MySQL table generator with typed schema
- [ ] 🔐 Event logging and history (logins, settings changes, etc.)
- [ ] 💳 "Magic wand" for user impersonation by superadmins
- [ ] 👩‍💻 Express middleware for token check which returns user
- [ ] 🔐 Support for refresh tokens (i.e., "Keep me logged in for 30 days")
- [ ] 🔐 Two-factor authentication with TOTP (and Twilio?)
- [ ] 🇪🇺 Email preferences (1 = security, 2 = notifications, 3 = promotions, etc.)
- [ ] 👩‍💻 Sending rich HTML transactional emails with Nodemailer
- [ ] 🇪🇺 GDPR data export, delete (schedule deletion for 30 days)
- [ ] 💳 Store user preferences like language, and prefers-reduced-motion
- [ ] 💳 Organization customization like logo, force 2FA, etc.
- [ ] 👩‍💻 Examples for Express, Fastify, etc.
- [ ] 💳 Affiliate accounts, dashboard, commissions

## 📄 License

MIT

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://anandchowdhary.com/?utm_source=github&utm_campaign=about-link"><img src="https://avatars3.githubusercontent.com/u/2841780?v=4" width="100px;" alt="Anand Chowdhary"/><br /><sub><b>Anand Chowdhary</b></sub></a><br /><a href="https://github.com/AnandChowdhary/staart/commits?author=AnandChowdhary" title="Code">💻</a> <a href="https://github.com/AnandChowdhary/staart/commits?author=AnandChowdhary" title="Documentation">📖</a> <a href="#design-AnandChowdhary" title="Design">🎨</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!