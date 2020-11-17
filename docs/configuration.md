# Configuration

You can use environment variables to set configuration values.

## Security

| Environment variable        | Description                     | Default value |
| --------------------------- | ------------------------------- | ------------- |
| `SALT_ROUNDS`               | Number of password salt rounds  | 10            |
| `JWT_SECRET`                | Secret to sign JWTs             | staart        |
| `TOTP_WINDOW_PAST`          | Expired TOTP tokens to accept   | 1             |
| `TOTP_WINDOW_FUTURE`        | Future TOTP tokens to accept    | 0             |
| `MFA_TOKEN_EXPIRY`          | Expiry time for MFA tokens      | 10m           |
| `MERGE_USERS_TOKEN_EXPIRY`  | Expiry time to merging link     | 30m           |
| `ACCESS_TOKEN_EXPIRY`       | Expiry time for access tokens   | 1h            |
| `PASSWORD_PWNED_CHECK`      | Check for Pwned passwords       | false         |
| `DELETE_EXPIRED_SESSIONS`   | Delete inactive sessions (days) | 30            |
| `INACTIVE_USER_DELETE_DAYS` | Delete deactivated users (days) | 30            |

## Email

You can set the following environment variables to specify the name and from email address:

| Environment variable | Description         |
| -------------------- | ------------------- |
| `EMAIL_NAME`         | Name of the service |
| `EMAIL_FROM`         | From email address  |

If you want to use SMTP, you should additionally set the configuration:

| Environment variable | Description      |
| -------------------- | ---------------- |
| `EMAIL_HOST`         | Host             |
| `EMAIL_PORT`         | Port             |
| `EMAIL_SECURE`       | Secure (boolean) |
| `EMAIL_USER`         | Username         |
| `EMAIL_PASSWORD`     | Password         |

Alternately, if you want to use AWS SES, you should set these instead (note that you can also use SMTP with SES):

| Environment variable          | Description    |
| ----------------------------- | -------------- |
| `EMAIL_SES_ACCESS_KEY_ID`     | AWS access key |
| `EMAIL_SES_SECRET_ACCESS_KEY` | AWS secret key |
| `EMAIL_SES_REGION`            | AWS region     |

To generate an access/secret key pair, you can create an IAM user with the permission `AmazonSESFullAccess`. For more details, read the article [Creating an IAM user in your AWS account](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html#id_users_create_console) on the AWS website.

### Rate limiting

Staart API has three types of rate limits. When an endpoint is accessed, 1 point is consumed. There are also some endpoints that consume additional points (like logging in or creating an account consumes 10 points). The types of rate limits are:

1. "Public" for unauthenticated requests (250 points/hour)
2. "Authenticated" for requests with a user access token (5k points/hour)
3. "API key" for (automated) requests using an API key (10k points/hour)

You can set the rate limits for each of these categories. By default, the rate limit resets after one hour:

| Environment variable                | Description                      | Default |
| ----------------------------------- | -------------------------------- | ------- |
| `RATE_LIMIT_PUBLIC_POINTS`          | Maximum points for public        | 250     |
| `RATE_LIMIT_PUBLIC_DURATION`        | Reset duration for public        | 3600    |
| `RATE_LIMIT_AUTHENTICATED_POINTS`   | Maximum points for authenticated | 5000    |
| `RATE_LIMIT_AUTHENTICATED_DURATION` | Reset duration for authenticated | 3600    |
| `RATE_LIMIT_API_KEY_POINTS`         | Maximum points for API key       | 10000   |
| `RATE_LIMIT_API_KEY_DURATION`       | Reset duration for API key       | 3600    |

## Optional services

### ElasticSearch

ElasticSearch is used for tracking API key logs.

If you have a public ElasticSearch instance (this is not recommended), you only need to specify the node:

```env
ELASTICSEARCH_NODE = "https://your-endpoint.example"
```

If your endpoint uses HTTP basic authentication, you can add the credentials:

```env
ELASTICSEARCH_AUTH_USERNAME = "Your username"
ELASTICSEARCH_AUTH_PASSWORD = "Your password"
```

Or, if you're using an ElasticSearch-hosted instance with an API key, you can provide only the API key or a combination of the API key and ID:

```env
ELASTICSEARCH_AUTH_API_KEY = "Your API key"
ELASTICSEARCH_AUTH_API_KEY_ID = "Your API key ID"
```

Alternately, if you're using the Amazon Elasticsearch Service, you can specify the AWS credentials:

```env
ELASTICSEARCH_NODE = "https://search-your-endpoint.us-east-1.es.amazonaws.com"
ELASTICSEARCH_AWS_ACCESS_KEY_ID = "Your AWS access key ID"
ELASTICSEARCH_AWS_SECRET_ACCESS_KEY = "Your AWS secret access key"
ELASTICSEARCH_AWS_REGION = "us-east-1"
```

### Twilio SMS

To send SMS messages using Twilio, you should set the following environment variables:

| Environment variable | Description           |
| -------------------- | --------------------- |
| `TWILIO_ACCOUNT_SID` | Twilio account SID    |
| `TWILIO_AUTH_TOKEN`  | Twilio auth token     |
| `SMS_FAIL_RETRIES`   | Number of SMS retries |
