import { query, setValues, removeReadOnlyValues } from "../helpers/mysql";
import { KeyValue } from "../interfaces/general";

/*
 * Get pagination data
 */
export const getPaginatedData = async ({
  table,
  conditions,
  start = 0,
  itemsPerPage = 5,
  primaryKey = "id",
  q,
  search,
  sort = "asc"
}: {
  table: string;
  conditions?: KeyValue;
  start?: number;
  itemsPerPage?: number;
  primaryKey?: string;
  q?: string;
  search?: string;
  sort?: string;
}) => {
  const data = (await query(
    `SELECT * FROM \`${table}\` WHERE ${primaryKey} ${
      sort === "asc" ? ">" : "<"
    } ? ${
      conditions
        ? `AND ${Object.keys(conditions)
            .map(condition => `${condition} = ?`)
            .join(" AND ")}`
        : ""
    }${
      q && search ? ` AND \`${search}\` LIKE "%?%"` : ""
    } ORDER BY ${primaryKey} ${sort.toUpperCase()} LIMIT ${itemsPerPage}`,
    [
      sort === "desc" && start == 0 ? 99999999999 : start,
      ...(conditions ? Object.values(conditions) : []),
      q
    ]
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
  data.updatedAt = new Date();
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
