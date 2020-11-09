[![Staart API](https://raw.githubusercontent.com/staart/staart.js.org/master/assets/svg/api.svg?sanitize=true)](https://staart.js.org/api)

Staart API is a Node.js backend starter for SaaS startups written in TypeScript. It has all the features you need to build a SaaS product, like user management and authentication, billing, organizations, GDPR tools, API keys, rate limiting, superadmin impersonation, and more.

|           | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build     | [![Node CI](https://github.com/koj-co/template/workflows/Node%20CI/badge.svg)](https://github.com/koj-co/template/actions?query=workflow%3A%22Node+CI%22) [![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/koj-co/template)](https://snyk.io/test/github/koj-co/template) [![Dependencies](https://img.shields.io/david/staart/api.svg)](https://david-dm.org/staart/api) [![Dev dependencies](https://img.shields.io/david/dev/staart/api.svg)](https://david-dm.org/staart/api)                                                                                         |
| PRs       | [![Pull Request Labeler](https://github.com/koj-co/template/workflows/Pull%20Request%20Labeler/badge.svg)](https://github.com/koj-co/template/actions?query=workflow%3A%22Pull+Request+Labeler%22) [![PR Generator CI](https://github.com/koj-co/template/workflows/PR%20Generator%20CI/badge.svg)](https://github.com/koj-co/template/actions?query=workflow%3A%22PR+Generator+CI%22) [![Merge PRs](https://github.com/koj-co/template/workflows/Merge%20PRs/badge.svg)](https://github.com/koj-co/template/actions?query=workflow%3A%22Merge+PRs%22)                                                               |
| Community | [![Contributors](https://img.shields.io/github/contributors/staart/api.svg)](https://github.com/staart/api/graphs/contributors) [![GitHub](https://img.shields.io/github/license/staart/api.svg)](https://github.com/staart/api/blob/master/LICENSE) ![Type definitions](https://img.shields.io/badge/types-TypeScript-blue.svg) [![npm package version](https://img.shields.io/npm/v/@staart/api)](https://www.npmjs.com/package/@staart/api) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) |

Staart API is build to work with [Staart UI](https://github.com/staart/ui), the frontend PWA starter for SaaS startups.

**⚠️ v3 BETA WARNING:** The `master` branch and all 3.x releases are currently in beta. For production, use v1.x instead.

## ⭐ Features

### 🆕 New in v2

- Casbin-powered permission management
- JWT-powered single-use coupon codes
- Redis-powered queues for outbound emails and logs
- Cloud agnostic, no longer specific to AWS
- Staart scripts for building and deploying
- Async JSON response and smart controller injection

### 🔐 Security

- JWT-powered authentication and user management
- TOTP-powered two-factor authentication (2FA)
- OAuth2 login with third-party accounts
- Location-based login verification
- Security event logging and history

### 💳 SaaS

- Stripe-powered recurring billing
- Teams with managed user permissions
- CRUD invoices, methods, transactions, etc.
- Rich HTML transactional emails
- GDPR-compliant data export and delete
- API gateway with API keys and rate limiting
- Domain verification with auto-approve members

### 👩‍💻 Developer utilities

- OvernightJS-powered decorators and class syntax
- Injection-proof helpers for querying databases
- Data pagination and CRUD utilities for all tables
- Authorization helpers
- Caching and invalidation for common queries
- User impersonation for super-admin
- Easy redirect rules in YAML
- ElasticSearch-powered server and event logs

## 🛠 Usage

1. Use this template or fork this repository
1. Install dependencies with `npm install`
1. Add a `.env` file based on [config.ts](https://github.com/staart/api/blob/master/src/config.ts).
1. Create MariaDB/MySQL tables based on [schema.sql](https://github.com/staart/api/blob/master/schema.sql)
1. Add your controllers in the `./src/controllers` directory
1. Generate your `app.ts` file using `staart controllers`
1. Build with `staart build` and deploy with `staart launch`

### Updating Staart

To update your installation of Staart, run the following:

```bash
staart update api
```

If you've used the "Use this template" option on GitHub, you might have to force pull from `staart/api` the first time since the histories wouldn't match. You can use the flag `--allow-unrelated-histories` in this case.

## 💻 Docs

- [Getting started](https://staart.js.org/api/getting-started.html)
- [Setting up environment variables](https://staart.js.org/api/setting-up-environment-variables.html)
- [Creating a controller](https://staart.js.org/api/creating-a-controller.html)
- [Updating Staart](https://staart.js.org/api/update.html)
- [Response headers](https://staart.js.org/api/response-headers.html)
- [Throwing errors](https://staart.js.org/api/throwing-errors.html)
- [Authorization](https://staart.js.org/api/authorization.html)
- [API key authentication](https://staart.js.org/api/api-key-authentication.html)
- [Redirects](https://staart.js.org/api/redirects.html)
- [Serving static files](https://staart.js.org/api/serving-static-files.html)

**[View docs site →](https://staart.js.org/api)**

**[View TypeDoc →](https://staart-typedoc.netlify.com)**

**[View API demo →](http://staart.prod.oswaldlabs.com)**

**[View frontend demo →](https://staart-demo.o15y.com)**

## 🏗️ Built with Staart

- [Oswald Labs Platform](https://github.com/OswaldLabsOpenSource/platform-v3)
- [Speakup Developer](https://github.com/speakupnl/staart)
- [**Add your Staart-based project**](https://github.com/staart/api/edit/master/README.md)

## [🏁 Staart Ecosystem](https://staart.js.org)

The Staart ecosystem consists of open-source projects to build your SaaS startup, written in TypeScript.

| Package                                                  |                                         |                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [🛠️ Staart API](https://github.com/staart/api)           | Node.js backend with RESTful APIs       | [![Build status](https://img.shields.io/circleci/build/github/staart/api)](https://circleci.com/gh/staart/api) [![Docs](https://img.shields.io/endpoint?url=https%3A%2F%2Fstaart.js.org%2Fshield-schema%2Fapi.json)](https://staart.js.org/api) [![npm package version](https://img.shields.io/npm/v/@staart/api)](https://www.npmjs.com/package/@staart/api)                                                         |
| [🌐 Staart UI](https://github.com/staart/ui)             | Frontend Vue.js Progressive Web App     | [![Build status](https://img.shields.io/circleci/build/github/staart/ui)](https://circleci.com/gh/staart/ui) [![Docs](https://img.shields.io/endpoint?url=https%3A%2F%2Fstaart.js.org%2Fshield-schema%2Fui.json)](https://staart.js.org/ui) [![npm package version](https://img.shields.io/npm/v/@staart/ui)](https://www.npmjs.com/package/@staart/ui)                                                               |
| [📑 Staart Site](https://github.com/staart/site)         | Static site generator for docs/helpdesk | [![Build status](https://img.shields.io/circleci/build/github/staart/site)](https://circleci.com/gh/staart/site) [![Docs](https://img.shields.io/endpoint?url=https%3A%2F%2Fstaart.js.org%2Fshield-schema%2Fsite.json)](https://staart.js.org/site) [![npm package version](https://img.shields.io/npm/v/@staart/site)](https://www.npmjs.com/package/@staart/site)                                                   |
| [📱 Staart Native](https://github.com/staart/native)     | React Native app for Android and iOS    | [![Build status](https://img.shields.io/circleci/build/github/staart/native)](https://circleci.com/gh/staart/native) [![Docs](https://img.shields.io/endpoint?url=https%3A%2F%2Fstaart.js.org%2Fshield-schema%2Fnative.json)](https://staart.js.org/native) [![npm package version](https://img.shields.io/npm/v/@staart/native)](https://www.npmjs.com/package/@staart/native)                                       |
| [🎨 Staart.css](https://github.com/staart/css)           | Sass/CSS framework and utilities        | [![Build status](https://img.shields.io/circleci/build/github/staart/css)](https://circleci.com/gh/staart/css) [![Docs](https://img.shields.io/endpoint?url=https%3A%2F%2Fstaart.js.org%2Fshield-schema%2Fcss.json)](https://staart.js.org/css) [![npm package version](https://img.shields.io/npm/v/@staart/css)](https://www.npmjs.com/package/@staart/css)                                                         |
| [📦 Staart Packages](https://github.com/staart/packages) | Helper functions and utility packages   | [![Build status](https://img.shields.io/circleci/build/github/staart/packages)](https://circleci.com/gh/staart/packages) [![Custom badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fservices.anandchowdhary.now.sh%2Fapi%2Fgithub-files%3Frepo%3Dstaart%2Fpackages%26path%3Dpackages%26label%3Dstaart%26message%3D%25241%2524%2520package%2524S%2524%26color%3Dblueviolet)](https://www.npmjs.com/org/staart) |

## 💝 Sponsors

The development of Staart projects is supported by these wonderful companies. [Find us on OpenCollective](https://opencollective.com/staart)

<!-- prettier-ignore -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/OswaldLabsOpenSource"><img src="https://avatars3.githubusercontent.com/u/21421587?v=4" width="100px" alt=""/><br><sub><b>Oswald Labs</b></sub></a></td>
    <td align="center"><a href="https://github.com/O15Y"><img src="https://avatars3.githubusercontent.com/u/48348500?v=4" width="100px" alt=""/><br><sub><b>O15Y</b></sub></a></td>
    <td align="center"><a href="https://github.com/speakupnl"><img src="https://avatars3.githubusercontent.com/u/33686381?v=4" width="100px" alt=""/><br><sub><b>Speakup</b></sub></a></td>
    <td align="center"><a href="https://github.com/netlify"><img src="https://avatars3.githubusercontent.com/u/7892489?v=4" width="100px" alt=""/><br><sub><b>Netlify</b></sub></a></td>
    <td align="center"><a href="https://github.com/koj-co"><img src="https://avatars3.githubusercontent.com/u/65495851?v=4" width="100px" alt=""/><br><sub><b>Koj</b></sub></a></td>
  </tr>
</table>

## 📄 License

- Code: [MIT](https://github.com/staart/api/blob/master/LICENSE)
- Logo and assets: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- [GeoLite2](https://dev.maxmind.com/geoip/geoip2/geolite2/): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- [GeoNames](http://www.geonames.org/): [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)
