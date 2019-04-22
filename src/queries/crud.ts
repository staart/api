import { getConnection } from "typeorm";
import { User } from "../entities/user";
import { Email } from "../entities/email";
import { Organization } from "../entities/organization";
import { Membership } from "../entities/membership";
import { BackupCode } from "../entities/backup-code";
import { mapStringToEntity } from "../helpers/mapStringToEntity";

export const create = async (
  entity: string,
  data: User | Email | Organization | Membership | BackupCode
) => {
  const connection = await getConnection();
  const into = mapStringToEntity(entity);
  await connection
    .createQueryBuilder()
    .insert()
    .into(User)
    .values(data)
    .execute();
};

export const read = async (entity: string, id: number) => {
  const connection = await getConnection();
  const into = mapStringToEntity(entity);
  const record = await connection
    .getRepository(into)
    .createQueryBuilder()
    .where(`${entity}.id = :id`, { id })
    .getOne();
  return record;
};

export const update = async (
  entity: string,
  id: number,
  data: User | Email | Organization | Membership | BackupCode
) => {
  const connection = await getConnection();
  const into = mapStringToEntity(entity);
  const updatedRecord = await connection
    .createQueryBuilder()
    .update(into)
    .set(data)
    .where("id = :id", { id })
    .execute();
  return updatedRecord;
};

export const remove = async (entity: string, id: number) => {
  const connection = await getConnection();
  const into = mapStringToEntity(entity);
  await connection
    .createQueryBuilder()
    .delete()
    .from(into)
    .where("id = :id", { id })
    .execute();
};
