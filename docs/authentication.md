# Authentication

Users can log in to Staart API using several methods:

- Login with an email/password combination
- Passwordless login (only enter your email and receive a login link)
- Custom SAML-based login (coming soon)

All of these methods also support multi-factor authentication (MFA) using:

- TOTP-based application
- SMS message
- Email

On successful login, users receive an access token and a refresh token. The access token is a JSON Web Token (JWT) valid for one hour, and the refresh token is a UUID stored in the `sessions` table in the database with no expiry. Users can manually invalidate the refresh token by deleting the corresponding session, and sessions are auto-deleted after 30 days of inactivity. Each access token includes the scopes a user has access to. Users can also alternately create API keys with scopes for their account or any groups they are a member of.

Bearer authentication is used to specify the access token or API key, using the `Authorization` header.

## Routes

### Public routes

By default, all endpoints required authentication. The `@Public()` decorator can be used on a controller or specific route to skip authentication. By default, all auth routes (for example, logging in and registration) don't require authentication:

```ts
@Controller('auth')
@Public()
export class AuthController {
  constructor() {}
}
```

You can also make a single route public:

```ts
@Controller('example')
export class ExampleController {
  constructor() {}

  @Get('public')
  @Public() // The route /example/public is public
  async example(): Promise<boolean> {
    return true;
  }
}
```

#### Under the hood

The `Public()` decorator was proposed in [nestjs/nest/#5598](https://github.com/nestjs/nest/issues/5598) as a solution to the lack of reorderability of Guards in Nest.
