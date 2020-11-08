# Eenvironment variables

All environment variables are stored in a `.env` file locally. All environment variables are optional.

You can also set these variables in `.staartrc.json` using camel cased names. This is recommended when your environment variables are not secrets; for example, you can set your API keys as `.env` values, but publicly-available information like the port and frontend URLs can be in `staartrc.json`. For example, the `FRONTEND_URL` environment variable can be set as `frontendUrl` in `.staartrc.json`.

## Port

The first and most important is the port you want the Staart backend process to run on. On production, this is usually `80`. Locally, it can be something like `3000` or `8080`. In these examples, we'll use the port 7007.

```env
PORT = 7007
```

This will launch the app on http://localhost:7007.

### URLs

When sending emails and performing redirects, the URL of your frontend app is required. In most cases, this is the URL on which [Staart UI](https://github.com/staart/ui) is running:

```env
FRONTEND_URL = "https://example.com"
```

### Database connection

Once you have your database details (host, username, password, and databse name), you can create a file with the path `prisma/.env` with your database URL:

```env
DATABASE_URL = "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
```

Similarly, a MySQL or MariaDB URL looks like:

```env
DATABASE_URL = "mysql://USER:PASSWORD@HOST:PORT/DATABSE"
```

You can read more about this URL on the [Add to existing project](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project-typescript-postgres#connect-your-database) article on the Prisma docs website.

### Sending emails

Staart API sends transactions emails for email verification, password resets, etc. You can either send emails using SMTP or AWS SES. If you want to use SMTP:

```env
EMAIL_HOST = "smtp.example.com"
EMAIL_FROM = "hello@example.com"
EMAIL_PASSWORD = "your-password"
```

Alternately, you can use AWS SES to send emails:

```env
SES_EMAIL = "hello@example.com"
SES_REGION = "eu-west-2"
SES_ACCESS = "aws-access-key-xxxxxxxxxx"
SES_SECRET = "aws-secret-key-xxxxxxxxxx"
```

In the above example, emails are sent from `hello@example.com` and SES is setup in the `eu-west-2` AWS region with the given credentials.

### Billing

We use Stripe for billing and subscription management. You'll need your Stripe secret key and a product ID (you can use your test key to make sure people aren't actually charged). We use the product ID to show the pricing plans of that product.

```env
STRIPE_SECRET_KEY = "stripe-test-api-key"
STRIPE_PRODUCT_ID = "stripe-product-id"
```

### Encryption keys

It is highly recommended that you change the default encryption keys for signing JWTs, salts for hashes, etc. These should just be large (10+ character) strings, preferably a mix of letters, numbers, and special characters:

```env
JWT_SECRET = "secret"
TWT_SECRET = "secret"
```

### Redis

Staart API uses both Redis-based and in-memory caches to optimize queries and requests. If you’re running Redis using the default settings, you can ignore the `REDIS_URL` key, or populate it with your instance’s URL if it’s managed or on another port:

The TTL determines how long a result is cached in the memory; by default, this is 10 minutes. The check period tells Staart how often to check the cache and remove expired items (think of it like a `setInterval`). Organization details, API key scopes, etc., are stored in-memory for faster access, and Redis is primarily used to invalidate JWTs.

```env
REDIS_URL = "redis://127.0.0.1:6379"
CACHE_TTL = 600                  #     10 mins
CACHE_CHECK_PERIOD = 1000        #     1,000 s
```

### Rate limits

Rate limits help Staart mitigate some types of attacks. By default, users can do 60 requests/minute without an API key. With API key authentication, this is increased to 1,000 requests/minute. There is also a speed limit mechanism that delays requests by 100ms (in response time) per request if more than 500 are made in a minute.

Brute force prevention is used on authentication endpoints, where only 50 requests per 5 minutes are allowed, and users have to wait for (an increasing amount of) some time before they can make another request.

```env
## Brute force is used for auth endpoints
BRUTE_FREE_RETRIES = 50          # 50 requests
BRUTE_LIFETIME = 300000          #   in 5 mins

## Public limits
PUBLIC_RATE_LIMIT_MAX = 60       # 60 requests
PUBLIC_RATE_LIMIT_TIME = 60000   #    in 1 min
SPEED_LIMIT_COUNT = 500         # 1k requests
SPEED_LIMIT_TIME = 600000        #    in 1 min
SPEED_LIMIT_DELAY = 100          # delay 100ms

## Limits when using an API key
RATE_LIMIT_MAX = 1000            # 1k requests
RATE_LIMIT_TIME = 60000          #    in 1 min
```

### Expiry durations

JWTs are used for authentication and emails, and you can configure their expiry duration. Email verification links are valid for one week, password reset links for a day, and location approval links for 10 minutes.

In terms of authentication, a login session token is approved for 15 minutes and a refresh token is valid for 1 month.

```env
TOKEN_EXPIRY_EMAIL_VERIFICATION = "7d"
TOKEN_EXPIRY_PASSWORD_RESET = "1d"
TOKEN_EXPIRY_LOGIN = "15m"
TOKEN_EXPIRY_APPROVE_LOCATION = "10m"
TOKEN_EXPIRY_REFRESH = "30d"
```

### Disallow disposable emails

If you don't want users to be able to sign up using a disposable email address, set this to `false`.

```env
ALLOW_DISPOSABLE_EMAILS = false
```

### ElasticSearch for data and tracking

We use ElasticSearch to track events, analytics, and server logs. You can use AWS-managed ElasticSearch or your own instance. If you use AWS:

```env
AWS_ELASTIC_HOST = "https://name.region.es.amazonaws.com"
AWS_ACCESS_KEY_ID = "aws-access-key-xxxxxxxxxx"
AWS_SECRET_ACCESS_KEY = "aws-secret-key-xxxxxxxxxx"
AWS_REGION = "eu-west-2"
```

Alternately, you can also use a custom ElasticSearch service if you don’t want to use AWS. In this case, you have to specify the host, log, and API version.

### Sentry error tracking

If you want to track errors using Sentry, you can supply your DSN:

```env
SENTRY_DSN = "https://<key>@sentry.io/<project>"
```
