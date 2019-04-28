import {
  query,
  tableValues,
  setValues,
  removeReadOnlyValues
} from "../helpers/mysql";
import { Organization } from "../interfaces/tables/organization";
import { capitalizeFirstAndLastLetter, dateToDateTime } from "../helpers/utils";
import { KeyValue } from "../interfaces/general";

export const listAllOrganizations = async () => {
  return <Organization[]>await query("SELECT * from organizations");
};

export const createOrganization = async (organization: Organization) => {
  if (organization.name)
    organization.name = capitalizeFirstAndLastLetter(organization.name);
  organization.createdAt = new Date();
  organization.updatedAt = organization.createdAt;
  // Create organization
  return await query(
    `INSERT INTO organizations ${tableValues(organization)}`,
    Object.values(organization)
  );
};

export const getOrganization = async (id: number) => {
  return (<Organization[]>(
    await query(`SELECT * FROM organizations WHERE id = ? LIMIT 1`, [id])
  ))[0];
};

export const updateOrganization = async (
  id: number,
  organization: KeyValue
) => {
  organization.updatedAt = dateToDateTime(new Date());
  organization = removeReadOnlyValues(organization);
  return await query(
    `UPDATE organizations SET ${setValues(organization)} WHERE id = ?`,
    [...Object.values(organization), id]
  );
};

export const deleteOrganization = async (id: number) => {
  return await query("DELETE FROM organizations WHERE id = ?", [id]);
};
