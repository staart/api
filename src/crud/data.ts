import { query } from "../helpers/mysql";
import { KeyValue } from "../interfaces/general";

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
