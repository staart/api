import { can } from "../helpers/authorization";
import { Authorizations } from "../interfaces/enum";
import { getPaginatedData } from "../crud/data";
import { INSUFFICIENT_PERMISSION } from "@staart/errors";
import { KeyValue } from "../interfaces/general";
import {
  cleanElasticSearchQueryResponse,
  elasticSearch
} from "@staart/elasticsearch";
import { ms } from "@staart/text";
import { ELASTIC_LOGS_PREFIX } from "../config";

export const getAllOrganizationForUser = async (
  tokenUserId: string,
  query: KeyValue
) => {
  if (await can(tokenUserId, Authorizations.READ, "general"))
    return await getPaginatedData({
      table: "organizations",
      ...query
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getAllUsersForUser = async (
  tokenUserId: string,
  query: KeyValue
) => {
  if (await can(tokenUserId, Authorizations.READ, "general"))
    return await getPaginatedData({
      table: "users",
      ...query
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

/**
 * Get an API key
 */
export const getServerLogsForUser = async (
  tokenUserId: string,
  query: KeyValue
) => {
  if (!(await can(tokenUserId, Authorizations.READ, "general")))
    throw new Error(INSUFFICIENT_PERMISSION);
  const range: string = query.range || "7d";
  const from = query.from ? parseInt(query.from) : 0;
  const result = await elasticSearch.search({
    index: `${ELASTIC_LOGS_PREFIX}*`,
    from,
    body: {
      query: {
        bool: {
          must: [
            {
              range: {
                date: {
                  gte: new Date(new Date().getTime() - ms(range))
                }
              }
            }
          ]
        }
      },
      sort: [
        {
          date: { order: "desc" }
        }
      ],
      size: 10
    }
  });
  return cleanElasticSearchQueryResponse(result.body, 10);
};
