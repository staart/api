![Staart](https://raw.githubusercontent.com/o15y/staart/master/assets/logo.png)

[![Travis CI](https://img.shields.io/travis/o15y/staart.svg)](https://travis-ci.org/o15y/staart)
[![Dependencies](https://img.shields.io/david/o15y/staart.svg)](https://david-dm.org/o15y/staart)
[![Dev dependencies](https://img.shields.io/david/dev/o15y/staart.svg)](https://david-dm.org/o15y/staart)
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

1. Fork this repository
1. Install dependencies with `yarn` or `npm i`
1. Add a `.env` file based on [config.ts](https://github.com/o15y/staart/blob/master/src/config.ts).
1. Create MariaDB/MySQL tables based on [schema.sql](https://github.com/o15y/staart/blob/master/schema.sql)
1. Add your controllers in the `./src/controllers` directory
1. Generate your `app.ts` file using `yarn generate-routes`
1. Build with `yarn build` and deploy with `yarn start`

## 💻 API

Staart comes with tens of helper and CRUD methods for users, organizations, and more.

**[View wiki docs →](https://github.com/o15y/staart/wiki)**

**[View TypeDoc →](https://staart-docs.o15y.com)**

**[View API demo →](https://staart.caprover.oswaldlabs.com)**

**[View frontend demo →](https://staart-demo.o15y.com)**

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
import { Authorizations, ErrorCode } from "../interfaces/enum";
import { authHandler, bruteForceHandler } from "../helpers/middleware";
import { deleteOrganization } from "../crud/organization";

// Your controller here
@Get("delete/:id")
@Middleware(authHandler)
@Middleware(bruteForceHandler)
async deleteOrg(req: Request, res: Response) {
  const orgId = (req.params as any).id;
  const userId = res.locals.token.id;
  if (await can(userId, Authorizations.DELETE, "organization", orgId)) {
    await deleteOrganization(orgId);
    return res.status(204);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
}
```

In the above example, the Staart helpers and middleware used are:

- Authentication (`authHandler`): Checks if a user's token is valid and adds `res.locals.token`; and if it isn't, sends a `401 Unauthorized` error.
- Brute force prevention (`bruteForceHandler`): Prevents users from making too many requests in a short time, can be configured via `./src/config.ts`
- Authorization (`can`): Returns whether a user is allowed to perform an action based on their permissions

Of course, we actually prefer to write our logic in the `rest` folder and only the handler as a controller. For a deeper dive into Staart, look at our [Wiki docs](https://github.com/o15y/staart/wiki).

## 👥 Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://anandchowdhary.com/?utm_source=github&utm_campaign=about-link"><img src="https://avatars3.githubusercontent.com/u/2841780?v=4" width="100px;" alt="Anand Chowdhary"/><br /><sub><b>Anand Chowdhary</b></sub></a><br /><a href="https://github.com/o15y/staart/commits?author=AnandChowdhary" title="Code">💻</a> <a href="https://github.com/o15y/staart/commits?author=AnandChowdhary" title="Documentation">📖</a> <a href="#design-AnandChowdhary" title="Design">🎨</a></td><td align="center"><a href="http://komiserback@gmail.com"><img src="https://avatars3.githubusercontent.com/u/36298335?v=4" width="100px;" alt="reallinfo"/><br /><sub><b>reallinfo</b></sub></a><br /><a href="#design-reallinfo" title="Design">🎨</a></td><td align="center"><a href="https://github.com/coooolers"><img src="https://avatars2.githubusercontent.com/u/20610084?v=4" width="100px;" alt="Cool"/><br /><sub><b>Cool</b></sub></a><br /><a href="https://github.com/o15y/staart/issues?q=author%3Acoooolers" title="Bug reports">🐛</a> <a href="#ideas-coooolers" title="Ideas, Planning, & Feedback">🤔</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## 📄 License

- Code: [MIT](https://github.com/o15y/staart/blob/master/LICENSE)
- Logo and assets: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
