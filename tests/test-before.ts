import { execSync } from 'child_process';
import { pathExists, writeFile } from 'fs-extra';
import { join } from 'path';

export const beforeRunningApp = async () => {
  // Write a test .env file
  const hasDotEnv = await pathExists(join('.', '.env'));
  if (!hasDotEnv)
    await writeFile(
      join('.', '.env'),
      `
DATABASE_URL = "mysql://root:@127.0.0.1:${process.env.DB_PORT || 3306}/api-test"

`,
    );

  if (!hasDotEnv)
    console.log(execSync('npx prisma db push --preview-feature').toString());
};
beforeRunningApp();
