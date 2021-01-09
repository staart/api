# Getting started

**Staart API** helps you build your software-as-a-service (SaaS) backend without the hassles. It includes features that every SaaS product needs, like authentication, recurring billing, teams, emails, and more.

To get started, you can use GitHub's template feature (see [Creating a repository from a template](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template)) by going to the [staart/api](https://github.com/staart/api) repository and clicking the "Use this template" button.

## After creating the repository

### Clone

Once you've created the template repository, you can clone it and enter the project directory. In the following example, "repo" is the name of the repository and "username" is your GitHub username.

```bash
git clone https://github.com/username/repo && cd repo
```

### Install dependencies

Install dependencies using npm:

```bash
npm install
```

### Change package.json

You can add your repository metadata in the `package.json` file.

```json
{
  "name": "your-project-name",
  "version": "0.0.0"
}
```

You can change `@staart/api` with `your-project-name`. It is also recommended to change the version to `0.0.0` so that Semantic Release can take over the versioning process on push.

Optionally, you can update the `repository`, `author`, and `license` keys based on your preferences.

### Set up your database

Initially, we'll start by migrating the Staart database schema to your database. Later on, you can update the schema to your liking.

First, create a remote or local database. You can use any SQL-based database management system supported by Prisma (see [Supported databases](https://www.prisma.io/docs/more/supported-databases)), such as MySQL, MariaDB, PostgreSQL, or SQLite. AWS-managed databases such as Aurora and Aurora Serverless are also supported.

Once you have your database details (host, username, password, and databse name), you can create a file with the path `prisma/.env` with your database URL:

```env
DATABASE_URL = "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
```

Note that this environment variable file is in the `prisma` directory, and is separate from the file in the project root. You can read more about this URL on the [Add to existing project](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project-typescript-postgres#connect-your-database) article on the Prisma docs website.

#### Setting up your database

Once you've added the database URL, you can perform the following step to create SQL tables (see [Prisma Migrate](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-migrate))

```bash
npx prisma db push --preview-feature
```

### Add environment variables

The next step is to add the basic environment variables. Start by creating a `.env` file in the project directory and add the `APP_NAME`. You should also add the `DATABASE_URL` that you previously added to `prisma/.env`:

```env
APP_NAME = "Staart"
DATABASE_URL = "mysql://root:password@example.com:3306/database-name"
```

### Run locally

To run the project, use the following npm script:

```bash
npm run start:dev
```

Alternately, you can use separate `build` and `launch` steps, for example in a Dockerfile:

```bash
npm run build
npm run launch
```
