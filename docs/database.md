# Database

Staart uses [prisma/prisma](https://github.com/prisma/prisma) under the hood, which is a modern ORM alternative. You can ues any of the databases supported by Prisma: PostgreSQL, MySQL, or SQLite. Support for Microsoft SQL Server is also in beta. Your database should already be created before setting up the connection.

## Database connection

To get started, add the required required environment variables in your `.env` file. The `DATABASE_URL` variable is usually set with [dotenv-expand](https://github.com/motdotla/dotenv-expand) variables:

```env title=".env"
DATABASE_URL = "${DB_PROVIDER}://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_POST}/${DB_NAME}"
```

Then, you can set the individual environment variables:

| Environment variable | Description                      |
| -------------------- | -------------------------------- |
| `DB_PROVIDER`        | Database provider, e.g., "mysql" |
| `DB_USER`            | Username                         |
| `DB_PASSWORD`        | Password                         |
| `DB_HOST`            | Hostname                         |
| `DB_POST`            | Database port, e.g., 3306        |
| `DB_NAME`            | Databse name to use              |

Alternately, you can also set the `DATABASE_URL` variable directly. For more information about this connection, you can visit the article on the Prisma website: [Using environment variables](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-schema#using-environment-variables).

## Setting up

When you're setting your database for the first time, you should use the `prisma migrate` command:

```
npx prisma migrate save --experimental
npx prisma migrate up --experimental
```

You can learn more about the `migrate` command on the documentatino page: [Prisma Migrate](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-migrate).
