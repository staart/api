# Authorization with scopes

The `@Scopes()` decorator is used on routes to ensure scope-based authorization. To better understand how Staart works with scopes in routes, let's look at the controller for a user's emails:

```ts
@Controller('users/:userId/emails')
export class EmailController {
  constructor(private emailsService: EmailsService) {}
  @Get(':id')
  @Scopes('user-{userId}:read-email-{id}')
  async get(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<emails>> {
    return this.emailsService.getEmail(userId, Number(id));
  }
}
```

In line 5 of the above code snippet, the scope for this endpoints is `@Scopes('user-{userId}:read-email-{id}')`. The route parameters `userId` and `id` will be replaced with their values. For example, for a user with ID 123 to get an email with ID 456, the scope required is `user-123:read-email-456`.

## Glob matching

The scope provided to a user (with ID 123, for example) when logging in to their account is `user-123:*`. Staart uses glob-based matching to ensure their have access to authorized routes.

In the above example, the user can access this resource because `user-123:*` matches `user-123:read-email-456`.

When creating personal access tokens using the interface or API, users can control which scopes they want access to. The above example scope `user-123:read-email-456` will be successfully matched by any of these values:

| Scope                     | Access to                                     |
| ------------------------- | --------------------------------------------- |
| `user-123:read-email-456` | Read only this particular email               |
| `user-123:read-email-*`   | Read all emails for this user                 |
| `user-123:read-*`         | Read all resources for this user              |
| `user-123:*`              | Read/write/delete all resources for this user |

There are also superuser scopes that are not available as personal access token scopes, but can be manually granted. These will, for example, also match this scope:

| Scope                 | Access to                                     |
| --------------------- | --------------------------------------------- |
| `user-*:read-email-*` | Read all emails for all users                 |
| `user-*:read-*`       | Read all resources for all users              |
| `user-*:*`            | Read/write/delete all resources for all users |
| `*`                   | Read/write/delete all resources               |

## `@Scopes()` decorator

The decorator can be used to which scopes a route requires.

Like mentioned above, the scopes decorator automatically replaces any route params in curly braces (`{}`):

```ts
@Scopes('user-{userId}:read-email-{id}') // user-123:read-email-456
```

Multiple scopes can also be specified, and permission will be granted if at least one of these scopes are matched:

```ts
@Scopes('user-{userId}:read-email-{id}', 'another-scope')
```

## Under the hood

The [`scope.guard.ts`](/src/modules/auth/scope.guard.ts) file contains the source code for this Guard. The matching utility [minimatch](https://github.com/isaacs/minimatch) is used to compare scopes, which in turn works by converting glob expressions into regular expressions.
