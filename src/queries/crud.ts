import { connect } from "../helpers/database";
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
  const connection = await connect();
  const into = mapStringToEntity(entity);
  await connection
    .createQueryBuilder()
    .insert()
    .into(into)
    .values(data)
    .execute();
  connection.close();
};

export const read = async (entity: string, id: number) => {
  const connection = await connect();
  const into = mapStringToEntity(entity);
  const record = await connection
    .getRepository(into)
    .createQueryBuilder()
    .where(`${entity}.id = :id`, { id })
    .getOne();
  connection.close();
  return record;
};

export const update = async (
  entity: string,
  id: number,
  data: User | Email | Organization | Membership | BackupCode
) => {
  const connection = await connect();
  const into = mapStringToEntity(entity);
  const updatedRecord = await connection
    .createQueryBuilder()
    .update(into)
    .set(data)
    .where("id = :id", { id })
    .execute();
  connection.close();
  return updatedRecord;
};

export const remove = async (entity: string, id: number) => {
  const connection = await connect();
  const into = mapStringToEntity(entity);
  await connection
    .createQueryBuilder()
    .delete()
    .from(into)
    .where("id = :id", { id })
    .execute();
  connection.close();
};
