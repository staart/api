import { query, tableValues, setValues } from "../helpers/mysql";
import { Membership } from "../interfaces/tables/memberships";
import { dateToDateTime } from "../helpers/utils";
import { KeyValue } from "../interfaces/general";
import { User } from "../interfaces/tables/user";
import { getOrganization } from "./organization";
import { ErrorCode } from "../interfaces/enum";

export const createMembership = async (membership: Membership) => {
  membership.createdAt = new Date();
  membership.updatedAt = membership.createdAt;
  return await query(
    `INSERT INTO memberships ${tableValues(membership)}`,
    Object.values(membership)
  );
};

export const updateMembership = async (id: number, membership: KeyValue) => {
  membership.updatedAt = dateToDateTime(new Date());
  return await query(
    `UPDATE memberships SET ${setValues(membership)} WHERE id = ?`,
    [...Object.values(membership), id]
  );
};

export const deleteMembership = async (id: number) => {
  return await query("DELETE FROM memberships WHERE id = ?", [id]);
};

export const getMembership = async (id: number) => {
  return (<Membership[]>(
    await query("SELECT * FROM memberships WHERE id = ? LIMIT 1", [id])
  ))[0];
};

export const getUserMembershipObject = async (user: User | number) => {
  let userId: number = 0;
  if (typeof user === "number") {
    userId = user;
  } else if (user.id) {
    userId = user.id;
  }
  if (!userId) throw new Error(ErrorCode.USER_NOT_FOUND);
  return <Membership>(
    await query(`SELECT * FROM memberships WHERE userId = ? LIMIT 1`, [userId])
  );
};

export const getUserOrganizationId = async (user: User | number) => {
  return (await getUserMembershipObject(user)).organizationId;
};

export const getUserOrganization = async (user: User | number) => {
  const organizationId = await getUserOrganizationId(user);
  return await getOrganization(organizationId);
};
