import { query, setValues, removeReadOnlyValues } from "../helpers/mysql";
import { KeyValue } from "../interfaces/general";
import { dateToDateTime } from "../helpers/utils";

/*
 * Get pagination data
 */
export const getPaginatedData = async (
  table: string,
  conditions?: KeyValue,
  index = 0,
  itemsPerPage = 5,
  primaryKey = "id"
) => {
  const data = (await query(
    `SELECT * FROM \`${table}\` WHERE ${primaryKey} > ? ${
      conditions
        ? `AND ${Object.keys(conditions)
            .map(condition => `${condition} = ?`)
            .join(" AND ")}`
        : ""
    } ORDER BY ${primaryKey} ASC LIMIT ${itemsPerPage}`,
    [index, ...(conditions ? Object.values(conditions) : [])]
  )) as any[];
  return {
    data,
    hasMore: data.length === itemsPerPage,
    next: data.length === itemsPerPage && data[data.length - 1][primaryKey]
  };
};

/**
 * Update general data
 */
export const updateData = async (
  table: string,
  conditions: KeyValue,
  data: KeyValue
) => {
  data.updatedAt = dateToDateTime(new Date());
  data = removeReadOnlyValues(data);
  return await query(
    `UPDATE \`${table}\` SET ${setValues(data)} WHERE ${Object.keys(conditions)
      .map(condition => `${condition} = ?`)
      .join(" AND ")}`,
    [...Object.values(data), ...Object.values(conditions)]
  );
};

/**
 * Update general data
 */
export const deleteData = async (table: string, conditions: KeyValue) => {
  return await query(
    `DELETE FROM \`${table}\` WHERE ${Object.keys(conditions)
      .map(condition => `${condition} = ?`)
      .join(" AND ")}`,
    [...Object.values(conditions)]
  );
};
