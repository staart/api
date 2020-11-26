## [v3.6.8](https://github.com/staart/api/compare/v3.6.7...v3.6.8) (2020-11-26)

### 🐛 Bug fixes

- [`4c5c427e`](https://github.com/staart/api/commit/4c5c427e)  Ignore auth if user is not found

## [v3.6.7](https://github.com/staart/api/compare/v3.6.6...v3.6.7) (2020-11-25)

### ♻️ Updates

- [`5afc6d23`](https://github.com/staart/api/commit/5afc6d23)  Add Slack method to message channel

## [v3.6.6](https://github.com/staart/api/compare/v3.6.5...v3.6.6) (2020-11-25)

### 🐛 Bug fixes

- [`553d08cd`](https://github.com/staart/api/commit/553d08cd)  Fix defaults for Twilio service

### ⬆️ Dependency updates

- [`5eb74986`](https://github.com/staart/api/commit/5eb74986)  Bump stripe from 8.125.0 to 8.126.0
- [`44136726`](https://github.com/staart/api/commit/44136726)  Bump @types/node from 14.14.9 to 14.14.10
- [`919bf7da`](https://github.com/staart/api/commit/919bf7da)  Bump @nestjs/passport from 7.1.3 to 7.1.5

## [v3.6.5](https://github.com/staart/api/compare/v3.6.4...v3.6.5) (2020-11-25)

### ♻️ Updates

- [`9ab66dfb`](https://github.com/staart/api/commit/9ab66dfb)  Use prisma code references

### 🐛 Bug fixes

- [`d63790e1`](https://github.com/staart/api/commit/d63790e1)  Fix Prisma update changes

### ⬆️ Dependency updates

- [`fd366850`](https://github.com/staart/api/commit/fd366850)  Update @prisma/client, @prisma/server to v2.12.0

## [v3.6.4](https://github.com/staart/api/compare/v3.6.3...v3.6.4) (2020-11-23)

## [v3.6.3](https://github.com/staart/api/compare/v3.6.2...v3.6.3) (2020-11-18)

### ♻️ Updates

- [`76181f1a`](https://github.com/staart/api/commit/76181f1a)  Add Stripe controllers to module
- [`018837c4`](https://github.com/staart/api/commit/018837c4)  Add billing portal session link
- [`dba69e18`](https://github.com/staart/api/commit/dba69e18)  Redirect to session home
- [`aa64deef`](https://github.com/staart/api/commit/aa64deef)  Use GET method for billing portal

### 🐛 Bug fixes

- [`a8011fc1`](https://github.com/staart/api/commit/a8011fc1)  Make req.user optional
- [`79ddd033`](https://github.com/staart/api/commit/79ddd033)  Use /billing/link URL for billing portal

### ⬆️ Dependency updates

- [`c2637fad`](https://github.com/staart/api/commit/c2637fad)  Update koj-co/template

## [v3.6.2](https://github.com/staart/api/compare/v3.6.1...v3.6.2) (2020-11-17)

### ♻️ Updates

- [`58971f05`](https://github.com/staart/api/commit/58971f05)  Use internal interceptor, decorator
- [`c6ba4afd`](https://github.com/staart/api/commit/c6ba4afd)  Use custom rate limiter

## [v3.6.1](https://github.com/staart/api/compare/v3.6.0...v3.6.1) (2020-11-17)

### 🐛 Bug fixes

- [`d1e7c654`](https://github.com/staart/api/commit/d1e7c654)  Remove unauthorized scopes from API keys

## [v3.6.0](https://github.com/staart/api/compare/v3.5.6...v3.6.0) (2020-11-16)

### ✨ New features

- [`666e37eb`](https://github.com/staart/api/commit/666e37eb)  Add endpoint for subgroups

### ♻️ Updates

- [`ef2dc724`](https://github.com/staart/api/commit/ef2dc724)  Get subgroup scopes on login
- [`c5c54c45`](https://github.com/staart/api/commit/c5c54c45)  Add select/include pipe
- [`2adfc21b`](https://github.com/staart/api/commit/2adfc21b)  Use create group helper in membership service
- [`4dd62efc`](https://github.com/staart/api/commit/4dd62efc)  Remove attributes from DTO
- [`9a9cca5d`](https://github.com/staart/api/commit/9a9cca5d)  Use /auth/link for token links
- [`0c2b15b3`](https://github.com/staart/api/commit/0c2b15b3)  Move merging accounts to auth.service
- [`70c5328b`](https://github.com/staart/api/commit/70c5328b)  Send token response on email verification

### 🐛 Bug fixes

- [`69a88ce7`](https://github.com/staart/api/commit/69a88ce7)  Return created membership with group
- [`3f9bbaef`](https://github.com/staart/api/commit/3f9bbaef)  Use email ID to verify, not user ID
- [`ed3a2103`](https://github.com/staart/api/commit/ed3a2103)  Combine specific keys of users, fix response

## [v3.5.6](https://github.com/staart/api/compare/v3.5.5...v3.5.6) (2020-11-15)

### ♻️ Updates

- [`d0a4aceb`](https://github.com/staart/api/commit/d0a4aceb)  Check for primary email on deleting emails
- [`1777332d`](https://github.com/staart/api/commit/1777332d)  Auto-join groups based on email address
- [`5abcc56d`](https://github.com/staart/api/commit/5abcc56d)  Use explicit ID type in params
- [`c499a62c`](https://github.com/staart/api/commit/c499a62c)  Store parsed details in session, Change Mac OS -&gt; macOS
- [`e54ddd9b`](https://github.com/staart/api/commit/e54ddd9b)  Allow cursors with implicit ID
- [`cf873b1a`](https://github.com/staart/api/commit/cf873b1a)  Use colon instead of space in order-by pipe

### 🐛 Bug fixes

- [`150f42f0`](https://github.com/staart/api/commit/150f42f0)  Ensure there is at least 1 owner in group
- [`3d73c616`](https://github.com/staart/api/commit/3d73c616)  Use groupId request param
- [`1804bf39`](https://github.com/staart/api/commit/1804bf39)  Render mustache before setting subject
- [`c3dcb4a5`](https://github.com/staart/api/commit/c3dcb4a5)  Fix scopes for user, groups routes
- [`3c645992`](https://github.com/staart/api/commit/3c645992)  Validate domain name
- [`3175c42d`](https://github.com/staart/api/commit/3175c42d)  Only add Stripe scopes if account exists

## [v3.5.5](https://github.com/staart/api/compare/v3.5.4...v3.5.5) (2020-11-15)

### 🐛 Bug fixes

- [`cfe9855a`](https://github.com/staart/api/commit/cfe9855a)  Return user info on update/delete

## [v3.5.4](https://github.com/staart/api/compare/v3.5.3...v3.5.4) (2020-11-15)

### 🐛 Bug fixes

- [`bacd1e0b`](https://github.com/staart/api/commit/bacd1e0b)  Include user in membership response

## [v3.5.3](https://github.com/staart/api/compare/v3.5.2...v3.5.3) (2020-11-15)

### ♻️ Updates

- [`ed3b942e`](https://github.com/staart/api/commit/ed3b942e)  Delete sessions on deactivate

## [v3.5.2](https://github.com/staart/api/compare/v3.5.1...v3.5.2) (2020-11-15)

### 🐛 Bug fixes

- [`a8c75f8b`](https://github.com/staart/api/commit/a8c75f8b)  Merge requests cannot go for the same user

## [v3.5.1](https://github.com/staart/api/compare/v3.5.0...v3.5.1) (2020-11-15)

### 🐛 Bug fixes

- [`95678056`](https://github.com/staart/api/commit/95678056)  Validate new email

## [v3.5.0](https://github.com/staart/api/compare/v3.4.0...v3.5.0) (2020-11-14)

### ✨ New features

- [`de4dd7a6`](https://github.com/staart/api/commit/de4dd7a6)  Add Google Maps module
- [`7d1c2918`](https://github.com/staart/api/commit/7d1c2918)  Add Playwrite module

### ♻️ Updates

- [`a7197cb5`](https://github.com/staart/api/commit/a7197cb5)  Rename service clients to &#x60;client&#x60;
- [`163f170e`](https://github.com/staart/api/commit/163f170e)  Use tokensService instead of jwtService
- [`16afe470`](https://github.com/staart/api/commit/16afe470)  Add default boolean configuration values

## [v3.4.0](https://github.com/staart/api/compare/v3.3.1...v3.4.0) (2020-11-13)

### ✨ New features

- [`99f17c8e`](https://github.com/staart/api/commit/99f17c8e)  Add Slack module
- [`bd930bec`](https://github.com/staart/api/commit/bd930bec)  Add Airtable module
- [`7bc5e7c6`](https://github.com/staart/api/commit/7bc5e7c6)  Add AWS S3 service
- [`37c1eb8b`](https://github.com/staart/api/commit/37c1eb8b)  Add Cloudinary module
- [`835eb270`](https://github.com/staart/api/commit/835eb270)  Add Firebase module
- [`a0eff5a8`](https://github.com/staart/api/commit/a0eff5a8)  Add GitHub module

## [v3.3.1](https://github.com/staart/api/compare/v3.3.0...v3.3.1) (2020-11-13)

### ♻️ Updates

- [`841ffef9`](https://github.com/staart/api/commit/841ffef9)  Add endpoints for API key logs
- [`f50a401c`](https://github.com/staart/api/commit/f50a401c)  Support logging authenticated requests

### 🐛 Bug fixes

- [`b9b30146`](https://github.com/staart/api/commit/b9b30146)  Ensure API key is a UUID

## [v3.3.0](https://github.com/staart/api/compare/v3.2.0...v3.3.0) (2020-11-13)

### ✨ New features

- [`bbb002f7`](https://github.com/staart/api/commit/bbb002f7)  Log API requests in ElasticSearch
- [`89b7bd2c`](https://github.com/staart/api/commit/89b7bd2c)  Delete old API logs

### ♻️ Updates

- [`a761d017`](https://github.com/staart/api/commit/a761d017)  Use Authorization header instead of X-Api-Key

### 🐛 Bug fixes

- [`b73cd6aa`](https://github.com/staart/api/commit/b73cd6aa)  Return API key data from LRU if available

## [v3.2.0](https://github.com/staart/api/compare/v3.1.2...v3.2.0) (2020-11-12)

### ✨ New features

- [`4631bbb8`](https://github.com/staart/api/commit/4631bbb8)  Add ElasticSearch service

## [v3.1.2](https://github.com/staart/api/compare/v3.1.1...v3.1.2) (2020-11-10)

### ♻️ Updates

- [`8e896920`](https://github.com/staart/api/commit/8e896920)  Add configuration for retries

### ⬆️ Dependency updates

- [`c03fb8d8`](https://github.com/staart/api/commit/c03fb8d8)  Update aws-sdk, stripe

## [v3.1.1](https://github.com/staart/api/compare/v3.1.0...v3.1.1) (2020-11-09)

### ♻️ Updates

- [`fb081a2c`](https://github.com/staart/api/commit/fb081a2c)  Allow email configuration of SES
- [`d576cf0e`](https://github.com/staart/api/commit/d576cf0e)  Change required config in SES

## [v3.1.0](https://github.com/staart/api/compare/v3.0.1...v3.1.0) (2020-11-09)

### ✨ New features

- [`48ba1763`](https://github.com/staart/api/commit/48ba1763)  Add account deactivate (fixed #1350)
(Issues: [`#1350`](https://github.com/staart/api/issues/1350))

### ♻️ Updates

- [`dc1a3704`](https://github.com/staart/api/commit/dc1a3704)  Auto-set account to active on login

## [v3.0.1](https://github.com/staart/api/compare/v3.0.0...v3.0.1) (2020-11-08)

### 🐛 Bug fixes

- [`ac17d989`](https://github.com/staart/api/commit/ac17d989)  Fix CWE-20 in URL parsing

## [v3.0.0](https://github.com/staart/api/compare/v2.21.0...v3.0.0) (2020-11-08)

### ✨ New features

- [`47ceb5bc`](https://github.com/staart/api/commit/47ceb5bc)  Add support for login links
- [`161b2643`](https://github.com/staart/api/commit/161b2643)  Add endpoint for password details
- [`ef5654db`](https://github.com/staart/api/commit/ef5654db)  Ship Casbin-powered permissions (fixed #337)
(Issues: [`#337`](https://github.com/staart/api/issues/337))- [`872559c6`](https://github.com/staart/api/commit/872559c6)  Add user access token scopes endpoint
- [`5225c309`](https://github.com/staart/api/commit/5225c309)  Add API scopes endpoint
- [`8de94323`](https://github.com/staart/api/commit/8de94323)  Add gender prediction API
- [`e9baebd9`](https://github.com/staart/api/commit/e9baebd9)  Auto-fill country, timezone
- [`cbb355ee`](https://github.com/staart/api/commit/cbb355ee)  Add Sentry
- [`ff44de69`](https://github.com/staart/api/commit/ff44de69)  Add support for disabling billing
- [`b248d84c`](https://github.com/staart/api/commit/b248d84c)  Add new user registrations check
- [`54774f25`](https://github.com/staart/api/commit/54774f25)  Add newUserRegistrationDomains check
- [`d6beaf83`](https://github.com/staart/api/commit/d6beaf83)  Add Prisma CRUD endpoints
- [`b1074976`](https://github.com/staart/api/commit/b1074976)  Add pipes for optional int, order by
- [`6b732e2a`](https://github.com/staart/api/commit/6b732e2a)  Add support for cursor
- [`6d43fcfe`](https://github.com/staart/api/commit/6d43fcfe)  Use DTO in PATCH method
- [`c9f03df3`](https://github.com/staart/api/commit/c9f03df3)  Add auth module with register
- [`c9291532`](https://github.com/staart/api/commit/c9291532)  Add registration with email conflict check
- [`b311e5af`](https://github.com/staart/api/commit/b311e5af)  Add common configuration
- [`7b6902d8`](https://github.com/staart/api/commit/7b6902d8)  Render and send emails
- [`9fe994d3`](https://github.com/staart/api/commit/9fe994d3)  Add HTML email layout
- [`a7979c22`](https://github.com/staart/api/commit/a7979c22)  Add resend email verification endpoint
- [`3b4a4680`](https://github.com/staart/api/commit/3b4a4680)  Add authentication
- [`5abd4987`](https://github.com/staart/api/commit/5abd4987)  Add refresh token endpoint
- [`d1e9e252`](https://github.com/staart/api/commit/d1e9e252)  Add scope authorization in Guard
- [`93d82e1c`](https://github.com/staart/api/commit/93d82e1c)  Expose data by removing secrets
- [`0e7c8b20`](https://github.com/staart/api/commit/0e7c8b20)  Add session endpoints
- [`8233d52a`](https://github.com/staart/api/commit/8233d52a)  Add endpoints for access tokens
- [`276c95a3`](https://github.com/staart/api/commit/276c95a3)  Add endpoints for user memberships
- [`f7082e0f`](https://github.com/staart/api/commit/f7082e0f)  Add emails module
- [`818ad11a`](https://github.com/staart/api/commit/818ad11a)  Add groups endpoints
- [`26c0c0ef`](https://github.com/staart/api/commit/26c0c0ef)  Add group membership controller
- [`a642b7ea`](https://github.com/staart/api/commit/a642b7ea)  Support creating groups, memberships
- [`183b6749`](https://github.com/staart/api/commit/183b6749)  Add Pwned module
- [`21a7cb4f`](https://github.com/staart/api/commit/21a7cb4f)  Add support for password change, refactor auth
- [`d99de49c`](https://github.com/staart/api/commit/d99de49c)  Add scheduler to delete sessions
- [`b3ec3fc4`](https://github.com/staart/api/commit/b3ec3fc4)  Add helmet for security
- [`754495e1`](https://github.com/staart/api/commit/754495e1)  Add OpenAPI docs
- [`e3628898`](https://github.com/staart/api/commit/e3628898)  Add tokens module, 2FA
- [`9aaee67a`](https://github.com/staart/api/commit/9aaee67a)  Add logout endpoint
- [`cee3a55c`](https://github.com/staart/api/commit/cee3a55c)  Add 2FA enable/disable endpoints
- [`f8f47f29`](https://github.com/staart/api/commit/f8f47f29)  Add password forgot/reset
- [`339a29da`](https://github.com/staart/api/commit/339a29da)  Add verify emails endpoint
- [`e4e78e1d`](https://github.com/staart/api/commit/e4e78e1d)  Add approved subnets endpoints
- [`b3f60938`](https://github.com/staart/api/commit/b3f60938)  Add geolocation service
- [`2c892e83`](https://github.com/staart/api/commit/2c892e83)  Add approve subnet endpoint
- [`0f219cdc`](https://github.com/staart/api/commit/0f219cdc)  Add support for MFA when logging in
- [`e314375b`](https://github.com/staart/api/commit/e314375b)  Login with email token endpoints
- [`8c7f926b`](https://github.com/staart/api/commit/8c7f926b)  Send membership welcome email
- [`9857fbc5`](https://github.com/staart/api/commit/9857fbc5)  Support logging in backup code
- [`f1337775`](https://github.com/staart/api/commit/f1337775)  Add group API keys module
- [`62ee163d`](https://github.com/staart/api/commit/62ee163d)  Add basic Stripe module
- [`0dc4b422`](https://github.com/staart/api/commit/0dc4b422)  Add Stripe invoices endpoints
- [`ec9ec37b`](https://github.com/staart/api/commit/ec9ec37b)  Add Twilio module
- [`ce710401`](https://github.com/staart/api/commit/ce710401)  Add SMS MFA OTP
- [`b147b685`](https://github.com/staart/api/commit/b147b685)  Add email MFA
- [`f39eddac`](https://github.com/staart/api/commit/f39eddac)  Add Stripe sources endpoints
- [`74df85c2`](https://github.com/staart/api/commit/74df85c2)  Add API key scopes
- [`2a8170f1`](https://github.com/staart/api/commit/2a8170f1)  Add domain module
- [`59a4a7cb`](https://github.com/staart/api/commit/59a4a7cb)  Add DNS module
- [`e160f8ef`](https://github.com/staart/api/commit/e160f8ef)  Add HTML domain verification
- [`9da99653`](https://github.com/staart/api/commit/9da99653)  Add subscription endpoints
- [`7506cb20`](https://github.com/staart/api/commit/7506cb20)  Handle Stripe webhook event
- [`049e3eb0`](https://github.com/staart/api/commit/049e3eb0)  Add audit logs module
- [`36bda486`](https://github.com/staart/api/commit/36bda486)  Create audit log
- [`47869cdd`](https://github.com/staart/api/commit/47869cdd)  Add webhooks module
- [`53ebb4a8`](https://github.com/staart/api/commit/53ebb4a8)  Trigger webhooks on audit log
- [`8a5c0152`](https://github.com/staart/api/commit/8a5c0152)  Implement LRU for API keys
- [`bf9976d8`](https://github.com/staart/api/commit/bf9976d8)  Add API key users controllers
- [`7c35bd21`](https://github.com/staart/api/commit/7c35bd21)  Serve static files
- [`cbc8034c`](https://github.com/staart/api/commit/cbc8034c)  Add support for merging users (fixed #950)
(Issues: [`#950`](https://github.com/staart/api/issues/950))- [`727b6112`](https://github.com/staart/api/commit/727b6112)  Add SMS-based MFA method

### ♻️ Updates

- [`3dadf22f`](https://github.com/staart/api/commit/3dadf22f)  Change snake to camel case
- [`e7ab0eb7`](https://github.com/staart/api/commit/e7ab0eb7)  Change organization to group
- [`5cd080ea`](https://github.com/staart/api/commit/5cd080ea)  Update organization group
- [`9691e797`](https://github.com/staart/api/commit/9691e797)  Update user service references
- [`dd86fb40`](https://github.com/staart/api/commit/dd86fb40)  Update org
- [`efbc78f9`](https://github.com/staart/api/commit/efbc78f9)  Organize imports, update user rest
- [`cabd9e13`](https://github.com/staart/api/commit/cabd9e13)  Make login password optional
- [`8b2e8e12`](https://github.com/staart/api/commit/8b2e8e12)  Use object param for mail
- [`6b09c3e3`](https://github.com/staart/api/commit/6b09c3e3)  Allow all attributes in mail
- [`4dc4bf69`](https://github.com/staart/api/commit/4dc4bf69)  Update helpers
- [`91ac3cc6`](https://github.com/staart/api/commit/91ac3cc6)  Use TWT instead of username
- [`3f3ccf14`](https://github.com/staart/api/commit/3f3ccf14)  Use number for ID, not string
- [`8cae2670`](https://github.com/staart/api/commit/8cae2670)  Remove fallback from TWT
- [`0efe1c8f`](https://github.com/staart/api/commit/0efe1c8f)  Use number instead of string in ID
- [`1a7a1181`](https://github.com/staart/api/commit/1a7a1181)  Use number IDs in controllers
- [`170ba999`](https://github.com/staart/api/commit/170ba999)  Add login link token to email
- [`5edf233a`](https://github.com/staart/api/commit/5edf233a)  Use number ID for user, validate number
- [`a3535905`](https://github.com/staart/api/commit/a3535905)  Use number for org ID
- [`2c201062`](https://github.com/staart/api/commit/2c201062)  Use TWT for IDs
- [`e70fa98c`](https://github.com/staart/api/commit/e70fa98c)  Use TWT of length 10
- [`8327891f`](https://github.com/staart/api/commit/8327891f)  Support all id-like keys with TWT
- [`bba4a39a`](https://github.com/staart/api/commit/bba4a39a)  Allow empty passwords
- [`ae0022b9`](https://github.com/staart/api/commit/ae0022b9)  Add decode TWT function
- [`5a6fa2e7`](https://github.com/staart/api/commit/5a6fa2e7)  Use string for ID validation
- [`08a2c53a`](https://github.com/staart/api/commit/08a2c53a)  Use Joi.number() for ID
- [`8c90ee64`](https://github.com/staart/api/commit/8c90ee64)  use take in rest
- [`d598a1f1`](https://github.com/staart/api/commit/d598a1f1)  Use any for res.locals
- [`9558c36d`](https://github.com/staart/api/commit/9558c36d)  Use take in Prisma
- [`905e0181`](https://github.com/staart/api/commit/905e0181)  Use new authorization helper in user.ts
- [`9301944a`](https://github.com/staart/api/commit/9301944a)  Add Casbin admin scopes
- [`02799be5`](https://github.com/staart/api/commit/02799be5)  Use new authorization can in group, auth
- [`28b0b142`](https://github.com/staart/api/commit/28b0b142)  Change params to subject, action, object
- [`cd1fb73e`](https://github.com/staart/api/commit/cd1fb73e)  Remove expiry from access tokens
- [`fefcdba2`](https://github.com/staart/api/commit/fefcdba2)  Move access token scopes to security
- [`2a75733f`](https://github.com/staart/api/commit/2a75733f)  Use constants in policy
- [`13490a14`](https://github.com/staart/api/commit/13490a14)  Update delete casbin policies
- [`3fac6c93`](https://github.com/staart/api/commit/3fac6c93)  Remove username validation
- [`63577fad`](https://github.com/staart/api/commit/63577fad)  Change API key, access token length to 32
- [`629b7aac`](https://github.com/staart/api/commit/629b7aac)  Update group ID as attribute
- [`1e040a76`](https://github.com/staart/api/commit/1e040a76)  Change stripeCustomerId to stripeCustomer
- [`9b760e1d`](https://github.com/staart/api/commit/9b760e1d)  Skip test for Stripe
- [`cd433d17`](https://github.com/staart/api/commit/cd433d17)  Make tracking optional
- [`d83146ce`](https://github.com/staart/api/commit/d83146ce)  Check tracking config before ES
- [`0f300e3b`](https://github.com/staart/api/commit/0f300e3b)  Move some config from file
- [`733f923d`](https://github.com/staart/api/commit/733f923d)  Use config helpr instead of imports
- [`b4c6176d`](https://github.com/staart/api/commit/b4c6176d)  Use email config with Nodemailer interface
- [`34eb080f`](https://github.com/staart/api/commit/34eb080f)  Use session UUID as refresh token
- [`527ab9a3`](https://github.com/staart/api/commit/527ab9a3)  Get user ID, scopes in JWT strategy
- [`3e259b43`](https://github.com/staart/api/commit/3e259b43)  Use access toke ngenerator abstraction
- [`6a31e886`](https://github.com/staart/api/commit/6a31e886)  Use local scope guards (https://stackoverflow.com/a/50801832/1656944)
- [`d30ce2fa`](https://github.com/staart/api/commit/d30ce2fa)  Use session ID as param
- [`959dc7b8`](https://github.com/staart/api/commit/959dc7b8)  Use global guards, @Public decorator
- [`be84f02f`](https://github.com/staart/api/commit/be84f02f)  Use new scope structure
- [`915c5ae6`](https://github.com/staart/api/commit/915c5ae6)  Send email not verified exception message
- [`b7cf9f39`](https://github.com/staart/api/commit/b7cf9f39)  Hash passwords, ensure uncompromised
- [`62d6ae04`](https://github.com/staart/api/commit/62d6ae04)  Use prisma directly not authService
- [`f7697ebd`](https://github.com/staart/api/commit/f7697ebd)  Use safe email helper
- [`75fc733f`](https://github.com/staart/api/commit/75fc733f)  Lowercase, remove plus from email
- [`e69cc370`](https://github.com/staart/api/commit/e69cc370)  Use import instead of import type
- [`750eb880`](https://github.com/staart/api/commit/750eb880)  Change 2fa to totp
- [`0857ae77`](https://github.com/staart/api/commit/0857ae77)  Use auth module-scoped constants
- [`3fb490fa`](https://github.com/staart/api/commit/3fb490fa)  Change approved location -&gt; approved subnet
- [`fe973961`](https://github.com/staart/api/commit/fe973961)  Hash approved subnets
- [`d0bb693c`](https://github.com/staart/api/commit/d0bb693c)  Add cache to geolocation
- [`d9899226`](https://github.com/staart/api/commit/d9899226)  Store geolocation in approved subnets
- [`24afea03`](https://github.com/staart/api/commit/24afea03)  Approve new subnets in auth
- [`63bac411`](https://github.com/staart/api/commit/63bac411)  Allow adding team members without name
- [`ffd8fdf8`](https://github.com/staart/api/commit/ffd8fdf8)  Generate/regenerate backup codes in 2FA
- [`e3349735`](https://github.com/staart/api/commit/e3349735)  Add email verification template
- [`d4c10d29`](https://github.com/staart/api/commit/d4c10d29)  Add create/delete/replace customer endpoint
- [`560c03ac`](https://github.com/staart/api/commit/560c03ac)  Allow uppercase sorting
- [`6c2897da`](https://github.com/staart/api/commit/6c2897da)  Use relative import paths
- [`170bc5de`](https://github.com/staart/api/commit/170bc5de)  Use .env data in configuration
- [`20d8cebb`](https://github.com/staart/api/commit/20d8cebb)  Change twoFactorEnabled -&gt; twoFactorMethod
- [`b5d94ce7`](https://github.com/staart/api/commit/b5d94ce7)  Use TokensService for UUID
- [`b490af16`](https://github.com/staart/api/commit/b490af16)  Update scopes in controllers
- [`3253de5b`](https://github.com/staart/api/commit/3253de5b)  Normalize domain URL
- [`c401a330`](https://github.com/staart/api/commit/c401a330)  Normalize +, . in emails
- [`c0b928a8`](https://github.com/staart/api/commit/c0b928a8)  Use raw/JSON middleware
- [`c797457b`](https://github.com/staart/api/commit/c797457b)  Change auth controller login routes
- [`aa80db1b`](https://github.com/staart/api/commit/aa80db1b)  Use constant for login token sub
- [`a39009b7`](https://github.com/staart/api/commit/a39009b7)  Add membership module to app
- [`27066a69`](https://github.com/staart/api/commit/27066a69)  Add pretty profile pictures for domain, group, user
- [`86a456d1`](https://github.com/staart/api/commit/86a456d1)  Add ID to auth token
- [`43e85967`](https://github.com/staart/api/commit/43e85967)  Use Gravatar as user profile picture
- [`5a1cb701`](https://github.com/staart/api/commit/5a1cb701)  Add audit log decorators on controller
- [`74705d67`](https://github.com/staart/api/commit/74705d67)  Add webhook scopes to API key
- [`6c546cfa`](https://github.com/staart/api/commit/6c546cfa)  Add webhook scopes endpoint
- [`89af8027`](https://github.com/staart/api/commit/89af8027)  Add group/user methods in API kes
- [`c84bccba`](https://github.com/staart/api/commit/c84bccba)  Add API key scopes for user
- [`24f0d246`](https://github.com/staart/api/commit/24f0d246)  Only allow clean, secure scopes in API keys
- [`b32c5af3`](https://github.com/staart/api/commit/b32c5af3)  Use custom JWT strategy
- [`49ed4a47`](https://github.com/staart/api/commit/49ed4a47)  Support referrer restrictions in API keys
- [`e24b26d0`](https://github.com/staart/api/commit/e24b26d0)  Check IP address restrictions in API keys
- [`269d1f17`](https://github.com/staart/api/commit/269d1f17)  Rename jwt -&gt; staart in auth
- [`500534bf`](https://github.com/staart/api/commit/500534bf)  Use user object in auth objects
- [`149651c2`](https://github.com/staart/api/commit/149651c2)  Use service name in loggers
- [`8ac6f7f3`](https://github.com/staart/api/commit/8ac6f7f3)  Send response time headers
- [`8e248ffa`](https://github.com/staart/api/commit/8e248ffa)  Don&#x27;t use native errors
- [`402ce140`](https://github.com/staart/api/commit/402ce140)  Don&#x27;t use HttpException
- [`a7ee700f`](https://github.com/staart/api/commit/a7ee700f)  Use error constants
- [`91aba2e3`](https://github.com/staart/api/commit/91aba2e3)  Add constants errors in pipes
- [`d0e58468`](https://github.com/staart/api/commit/d0e58468)  Add descriptions for errors
- [`52e5de85`](https://github.com/staart/api/commit/52e5de85)  Add global controller prefix

### 🐛 Bug fixes

- [`cf4a8fd7`](https://github.com/staart/api/commit/cf4a8fd7)  Wait for token to be generated
- [`128d995b`](https://github.com/staart/api/commit/128d995b)  Use Tokens.LOGIN_LINK to verify JWT
- [`661bf6d0`](https://github.com/staart/api/commit/661bf6d0)  Use string for userId in TWT
- [`75fc64fc`](https://github.com/staart/api/commit/75fc64fc)  Use take instead of first
- [`97b21181`](https://github.com/staart/api/commit/97b21181)  Use TWT in local to token
- [`780e7d6b`](https://github.com/staart/api/commit/780e7d6b)  Use where with ID key
- [`aea4d9f0`](https://github.com/staart/api/commit/aea4d9f0)  Use numbers not TWTs in controllers
- [`b3f2f9bc`](https://github.com/staart/api/commit/b3f2f9bc)  Use string adapter for casbin model
- [`294a5682`](https://github.com/staart/api/commit/294a5682)  Use integer IDs, not TWTs, in casbin policy
- [`14f3182e`](https://github.com/staart/api/commit/14f3182e)  Change scopes type in access token, API key
- [`17f07562`](https://github.com/staart/api/commit/17f07562)  Make sure user has a verified email
- [`dc67971e`](https://github.com/staart/api/commit/dc67971e)  Only allow admin, member roles in teams
- [`4d070cf1`](https://github.com/staart/api/commit/4d070cf1)  Create memberships manually
- [`27baa6ec`](https://github.com/staart/api/commit/27baa6ec)  Allow prefers email ID
- [`3a0f0c4d`](https://github.com/staart/api/commit/3a0f0c4d)  Change profilePicture to Url suffix
- [`87c9b13e`](https://github.com/staart/api/commit/87c9b13e)  Fix stripe customer ID key
- [`d3c8c255`](https://github.com/staart/api/commit/d3c8c255)  Change imports to config
- [`5e6d6918`](https://github.com/staart/api/commit/5e6d6918)  Make keys in DTO optional
- [`f27c6b9d`](https://github.com/staart/api/commit/f27c6b9d)  Ensure result exists before accessing user
- [`a166eaa1`](https://github.com/staart/api/commit/a166eaa1)  Fix use authentication in class
- [`9cdea097`](https://github.com/staart/api/commit/9cdea097)  Specify IP address when adding member, add module
- [`97096b3f`](https://github.com/staart/api/commit/97096b3f)  Use object payload for JWT
- [`99f9058d`](https://github.com/staart/api/commit/99f9058d)  Fix registration, location
- [`10a4b3c0`](https://github.com/staart/api/commit/10a4b3c0)  Fix password hash in Pwned
- [`087701ea`](https://github.com/staart/api/commit/087701ea)  Use module imports, not service
- [`fb46eeb4`](https://github.com/staart/api/commit/fb46eeb4)  Import StripeModule
- [`f883155b`](https://github.com/staart/api/commit/f883155b)  Move scopes endpoint to top
- [`e2541a16`](https://github.com/staart/api/commit/e2541a16)  Add ConfigModule to ApiKeysModule

### 🔒 Security issues

- [`e1d3e0cb`](https://github.com/staart/api/commit/e1d3e0cb)  Add AuthGuard in user endpoints
- [`653ccfc4`](https://github.com/staart/api/commit/653ccfc4)  Add scopes and guards on user routes

### ⬆️ Dependency updates

- [`5693784b`](https://github.com/staart/api/commit/5693784b)  Update @staart/redis
- [`c38e0464`](https://github.com/staart/api/commit/c38e0464)  Update @staart/redis to v2.3.0
- [`b9e775fd`](https://github.com/staart/api/commit/b9e775fd)  Update @staart/scripts to v1.17.0
- [`713dc5af`](https://github.com/staart/api/commit/713dc5af)  Update @staart/payments to v4.0.0
- [`59f2ec6b`](https://github.com/staart/api/commit/59f2ec6b)  Update @prisma to v2.4.1
- [`6e121dc5`](https://github.com/staart/api/commit/6e121dc5)  Update twt to v1.2.0
- [`71f81595`](https://github.com/staart/api/commit/71f81595)  Update cosmic to v1.0.1
- [`517fd0d1`](https://github.com/staart/api/commit/517fd0d1)  Update @staart/scripts to v1.18.0
- [`9bf7fcb5`](https://github.com/staart/api/commit/9bf7fcb5)  Update staart/scripts to v1.18.1
- [`51c8f8e8`](https://github.com/staart/api/commit/51c8f8e8)  Update @staart/elasticsearch to v2.2.4
- [`0edb1ad5`](https://github.com/staart/api/commit/0edb1ad5)  Update @staart/scripts to v1.18.2
- [`114e200d`](https://github.com/staart/api/commit/114e200d)  Update @sentry/node, @staart/scripts
- [`34242e21`](https://github.com/staart/api/commit/34242e21)  Update update-template to v1.1.2
- [`1262a0ff`](https://github.com/staart/api/commit/1262a0ff)  Update all dependencies
- [`5f48cf67`](https://github.com/staart/api/commit/5f48cf67)  Update all dependencies

### 💥 Breaking changes

- [`ec11d6f2`](https://github.com/staart/api/commit/ec11d6f2)  Add v3
