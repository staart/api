[![Staart API](https://raw.githubusercontent.com/staart/staart.js.org/master/assets/svg/api.svg?sanitize=true)](https://staart.js.org/api)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fstaart%2Fapi.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fstaart%2Fapi?ref=badge_shield)

Staart is a Node.js backend starter for SaaS startups written in TypeScript. It has built-in user management and authentication, billing, organizations, GDPR tools, and more.

|  | Status |
| - | - |
| Build | [![GitHub Actions](https://github.com/staart/api/workflows/Node%20CI/badge.svg)](https://github.com/staart/api/actions) [![Travis CI](https://img.shields.io/travis/staart/api?label=Travis%20CI)](https://travis-ci.org/staart/api) [![Circle CI](https://img.shields.io/circleci/build/github/staart/api?label=Circle%20CI)](https://circleci.com/gh/staart/api) [![Azure Pipelines](https://dev.azure.com/staart/api/_apis/build/status/staart.api?branchName=master)](https://dev.azure.com/staart/api/_build/latest?definitionId=1&branchName=master) |
| Dependencies | [![Dependencies](https://img.shields.io/david/staart/api.svg)](https://david-dm.org/staart/api) [![Dev dependencies](https://img.shields.io/david/dev/staart/api.svg)](https://david-dm.org/staart/api) ![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/staart/api.svg) |
| Community | [![Contributors](https://img.shields.io/github/contributors/staart/api.svg)](https://github.com/staart/api/graphs/contributors) [![GitHub](https://img.shields.io/github/license/staart/api.svg)](https://github.com/staart/api/blob/master/LICENSE) ![Type definitions](https://img.shields.io/badge/types-TypeScript-blue.svg) [![npm package version](https://img.shields.io/npm/v/@staart/manager)](https://www.npmjs.com/package/@staart/manager) |

Staart is build to work with [Staart UI](https://github.com/staart/ui), the frontend starter for SaaS.

## ⭐ Features

### 🔐 Security

- [x] Authentication and user management with JWT
- [x] Two-factor authentication with TOTP
- [x] Setup multiple emails for each account
- [x] OAuth2 login with third-party accounts
- [x] Location-based login verification
- [x] Security event logging and history

### 💳 SaaS

- [x] Subscriptions management with Stripe
- [x] Organizations, teams, and user permissions
- [x] Invoices, billing, credit cards, payments
- [x] Rich HTML transactional emails with SES
- [x] GDPR-proof data export and delete
- [ ] Affiliates and commission management
- [x] API gateway with API keys and rate limits
- [x] Auto-join members with domain verification

### 👩‍💻 Developer utilities

- [x] Decorators and class syntax with OvernightJS
- [x] Injection-proof helpers for querying databases
- [x] Data pagination and CRUD utilities for all tables
- [x] Authorization helpers (can a user do this?)
- [x] TypeScript interfaces for tables (ORM)
- [x] Caching and invalidation for common queries
- [x] User impersonation for super-admin
- [x] Easy redirect rules in YAML
- [x] Store server logs in ElasticSearch every minute

## 🛠 Usage

1. Use this template or fork this repository
1. Install dependencies with `yarn` or `npm i`
1. Add a `.env` file based on [config.ts](https://github.com/staart/api/blob/master/src/config.ts).
1. Create MariaDB/MySQL tables based on [schema.sql](https://github.com/staart/api/blob/master/schema.sql)
1. Add your controllers in the `./src/controllers` directory
1. Generate your `app.ts` file using `yarn generate-routes`
1. Build with `yarn build` and deploy with `yarn start`

### Updating Staart

To update your installation of Staart, run the following:

```bash
node setup/update.js
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

**[View API demo →](https://staart.caprover.oswaldlabs.com)**

**[View frontend demo →](https://staart-ui.o15y.now.sh)**

## 👩‍💼 Getting started

After forking this repository, you can get started by writing your first endpoint. We do this by creating a new file in the `./src/controllers` folder. For example, create `api.ts`:

```ts
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Get, Controller, ClassWrapper, Middleware } from "@overnightjs/core";
import { authHandler, validator } from "../helpers/middleware";
import Joi from "@hapi/joi";

@Controller("api")
@ClassWrapper(asyncHandler)
export class ApiController {
  @Get("hello")
  @Middleware(
    validator(
      { name: Joi.string().min(3).required() },
      "query"
    )
  )
  async sayHello(req: Request, res: Response) {
    const name = req.query.name;
    if (name === "Anand")
      return res.json({ text: `Hello, ${name}!`; });
    throw new Error("404/user-not-found");
  }
}
```

The above code 20 lines of code with create a new endpoint which can be accessed at `example.com/api/hello?name=Anand`, which will respond with a JSON object with the text "Hello, Anand!".

Staart code is easily understandable. You create a new controller, `api`, which means all routes in this class will have the prefix `/api`. Then, you create an HTTP GET method `hello` and use our built-in validator to say that the query parameter `name` must be a `string` of at least 3 characters.

With the `asyncHandler`, you can use async functions and Staart will handle errors for you. In this case, if the provided name is Anand, your function returns a JSON response "Hello, Anand!" and otherwise sends an error 404.

### Helpers

For common tasks such as finding users or authorizing API keys, Staart provides various helper functions.

Let's look at what you need to do if you want to let users be able to delete organizations. For this, you want to check where a user is actually allowed to delete that organization, if they're logged in, and make sure nobody can brute force this endpoint.

```ts
import { can } from "../helpers/authorization";
import { Authorizations } from "../interfaces/enum";
import { INSUFFICIENT_PERMISSION } from "@staart/errors";
import { authHandler, bruteForceHandler } from "../helpers/middleware";
import { deleteOrganization } from "../crud/organization";

// Your controller here
@Get("delete/:id")
@Middleware(authHandler)
@Middleware(bruteForceHandler)
async deleteOrg(req: Request, res: Response) {
  const orgId = req.params.id;
  const userId = res.locals.token.id;
  if (await can(userId, Authorizations.DELETE, "organization", orgId)) {
    await deleteOrganization(orgId);
    return res.status(204);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
}
```

In the above example, the Staart helpers and middleware used are:

- Authentication (`authHandler`): Checks if a user's token is valid and adds `res.locals.token`; and if it isn't, sends a `401 Unauthorized` error.
- Brute force prevention (`bruteForceHandler`): Prevents users from making too many requests in a short time, can be configured via `./src/config.ts`
- Authorization (`can`): Returns whether a user is allowed to perform an action based on their permissions

Of course, we actually prefer to write our logic in the `rest` folder and only the handler as a controller. For a deeper dive into Staart, look at our [Wiki docs](https://github.com/staart/api/wiki).

## 👥 Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table>
  <tr>
    <td align="center"><a href="https://anandchowdhary.com/?utm_source=github&utm_campaign=about-link"><img src="https://avatars3.githubusercontent.com/u/2841780?v=4" width="100px;" alt="Anand Chowdhary"/><br /><sub><b>Anand Chowdhary</b></sub></a><br /><a href="https://github.com/staart/api/commits?author=AnandChowdhary" title="Code">💻</a> <a href="https://github.com/staart/api/commits?author=AnandChowdhary" title="Documentation">📖</a> <a href="#design-AnandChowdhary" title="Design">🎨</a></td>
    <td align="center"><a href="http://komiserback@gmail.com"><img src="https://avatars3.githubusercontent.com/u/36298335?v=4" width="100px;" alt="reallinfo"/><br /><sub><b>reallinfo</b></sub></a><br /><a href="#design-reallinfo" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/coooolers"><img src="https://avatars2.githubusercontent.com/u/20610084?v=4" width="100px;" alt="Cool"/><br /><sub><b>Cool</b></sub></a><br /><a href="https://github.com/staart/api/issues?q=author%3Acoooolers" title="Bug reports">🐛</a> <a href="#ideas-coooolers" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/ektek"><img src="https://avatars1.githubusercontent.com/u/54689503?v=4" width="100px;" alt="EK"/><br /><sub><b>EK</b></sub></a><br /><a href="https://github.com/staart/api/issues?q=author%3Aektek" title="Bug reports">🐛</a> <a href="https://github.com/staart/api/commits?author=ektek" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/mattp95"><img src="https://avatars0.githubusercontent.com/u/29185361?v=4" width="100px;" alt="mattp95"/><br /><sub><b>mattp95</b></sub></a><br /><a href="https://github.com/staart/api/issues?q=author%3Amattp95" title="Bug reports">🐛</a></td>
  </tr>
</table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## 🏗️ Built with Staart

- [Oswald Labs Platform](https://github.com/OswaldLabsOpenSource/platform-v3)
- [Speakup Developer](https://github.com/speakupnl/staart)
- [**Add your Staart-based project**](https://github.com/staart/api/edit/master/README.md)

## [🏁 Staart Ecosystem](https://staart.js.org)

The Staart ecosystem consists of open-source projects to build your SaaS startup, written in TypeScript.

| Package |  |  |
| - | - | - |
| [🛠️ Staart API](https://github.com/staart/api) | Node.js backend with RESTful APIs | [![Build status](https://img.shields.io/circleci/build/github/staart/api)](https://circleci.com/gh/staart/api) [![Docs](https://img.shields.io/endpoint?url=https%3A%2F%2Fstaart.js.org%2Fshield-schema%2Fapi.json)](https://staart.js.org/api) [![npm package version](https://img.shields.io/npm/v/@staart/manager)](https://www.npmjs.com/package/@staart/manager) |
| [🌐 Staart UI](https://github.com/staart/ui) | Frontend Vue.js Progressive Web App | [![Build status](https://img.shields.io/circleci/build/github/staart/ui)](https://circleci.com/gh/staart/ui) [![Docs](https://img.shields.io/endpoint?url=https%3A%2F%2Fstaart.js.org%2Fshield-schema%2Fui.json)](https://staart.js.org/ui) [![npm package version](https://img.shields.io/npm/v/@staart/ui)](https://www.npmjs.com/package/@staart/ui) |
| [📑 Staart Site](https://github.com/staart/site) | Static site generator for docs/helpdesk | [![Build status](https://img.shields.io/circleci/build/github/staart/site)](https://circleci.com/gh/staart/site) [![Docs](https://img.shields.io/endpoint?url=https%3A%2F%2Fstaart.js.org%2Fshield-schema%2Fsite.json)](https://staart.js.org/site) [![npm package version](https://img.shields.io/npm/v/@staart/site)](https://www.npmjs.com/package/@staart/site) |
| [📱 Staart Native](https://github.com/staart/native) | React Native app for Android and iOS | [![Build status](https://img.shields.io/circleci/build/github/staart/native)](https://circleci.com/gh/staart/native) [![Docs](https://img.shields.io/endpoint?url=https%3A%2F%2Fstaart.js.org%2Fshield-schema%2Fnative.json)](https://staart.js.org/native) [![npm package version](https://img.shields.io/npm/v/@staart/native)](https://www.npmjs.com/package/@staart/native) |
| [🎨 Staart.css](https://github.com/staart/css) | Sass/CSS framework and utilities | [![Build status](https://img.shields.io/circleci/build/github/staart/css)](https://circleci.com/gh/staart/css) [![Docs](https://img.shields.io/endpoint?url=https%3A%2F%2Fstaart.js.org%2Fshield-schema%2Fcss.json)](https://staart.js.org/css) [![npm package version](https://img.shields.io/npm/v/@staart/css)](https://www.npmjs.com/package/@staart/css) |
| [📦 Staart Packages](https://github.com/staart/packages) | Helper functions and utility packages | [![Build status](https://img.shields.io/circleci/build/github/staart/packages)](https://circleci.com/gh/staart/packages) [![Custom badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fservices.anandchowdhary.now.sh%2Fapi%2Fgithub-files%3Frepo%3Dstaart%2Fpackages%26path%3Dpackages%26label%3Dstaart%26message%3D%25241%2524%2520package%2524S%2524%26color%3Dblueviolet)](https://www.npmjs.com/org/staart) |

## 💝 Sponsors

The development of Staart projects is supported by these wonderful companies. [Find us on OpenCollective](https://opencollective.com/staart)

<!-- prettier-ignore -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/OswaldLabsOpenSource"><img src="https://avatars3.githubusercontent.com/u/21421587?v=4" width="100px" alt=""/><br><sub><b>Oswald Labs</b></sub></a></td>
    <td align="center"><a href="https://github.com/O15Y"><img src="https://avatars3.githubusercontent.com/u/48348500?v=4" width="100px" alt=""/><br><sub><b>O15Y</b></sub></a></td>
    <td align="center"><a href="https://github.com/speakupnl"><img src="https://avatars3.githubusercontent.com/u/33686381?v=4" width="100px" alt=""/><br><sub><b>Speakup</b></sub></a></td>
  </tr>
</table>

## 📄 License

- Code: [MIT](https://github.com/staart/api/blob/master/LICENSE)
- Logo and assets: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- [GeoLite2](https://dev.maxmind.com/geoip/geoip2/geolite2/): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- [GeoNames](http://www.geonames.org/): [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)


[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fstaart%2Fapi.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fstaart%2Fapi?ref=badge_large)