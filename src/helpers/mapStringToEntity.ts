import { User } from "../entities/user";
import { Email } from "../entities/email";
import { Organization } from "../entities/organization";
import { Membership } from "../entities/membership";
import { BackupCode } from "../entities/backup-code";
import { HTTPError } from "../interfaces/error";

export const mapStringToEntity = (string: string) => {
  if (string === "user") return User;
  if (string === "email") return Email;
  if (string === "organization") return Organization;
  if (string === "membership") return Membership;
  if (string === "backupCode") return BackupCode;
  throw new Error(
    JSON.stringify({ status: 500, code: "invalid_entity" } as HTTPError)
  );
};
