# Authentication

To authenticate users, an email/password combination is used. Alternate options include passwordless login, two-factor authentication, and custom SAML-based login. On successful login, an access token and refresh token is provided. The access token is a JWT with a default expiration period of 1 hour, and the refresh token is a UUID stored in the database that never expires (but can be deleted by the user).

## Public routes

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

## Under the hood

The `Public()` decorator was proposed in [nestjs/nest/#5598](https://github.com/nestjs/nest/issues/5598) as a solution to the lack of reorderability of Guards in Nest.
