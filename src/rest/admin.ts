import {
  cleanElasticSearchQueryResponse,
  elasticSearch
} from "@staart/elasticsearch";
import { INSUFFICIENT_PERMISSION } from "@staart/errors";
import { ms } from "@staart/text";
import { ELASTIC_LOGS_PREFIX } from "../config";
import { can } from "../helpers/authorization";
import { Authorizations } from "../interfaces/enum";
import { KeyValue } from "../interfaces/general";
import { prisma } from "../helpers/prisma";
import {
  organizationsSelect,
  organizationsInclude,
  organizationsOrderByInput,
  organizationsWhereUniqueInput,
  usersSelect,
  usersInclude,
  usersOrderByInput,
  usersWhereUniqueInput
} from "@prisma/client";

export const getAllOrganizationForUser = async (
  tokenUserId: string,
  {
    select,
    include,
    orderBy,
    skip,
    after,
    before,
    first,
    last
  }: {
    select?: organizationsSelect;
    include?: organizationsInclude;
    orderBy?: organizationsOrderByInput;
    skip?: number;
    after?: organizationsWhereUniqueInput;
    before?: organizationsWhereUniqueInput;
    first?: number;
    last?: number;
  }
) => {
  if (await can(tokenUserId, Authorizations.READ, "general"))
    return prisma.organizations.findMany({
      select,
      include,
      orderBy,
      skip,
      after,
      before,
      first,
      last
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getAllUsersForUser = async (
  tokenUserId: string,
  {
    select,
    include,
    orderBy,
    skip,
    after,
    before,
    first,
    last
  }: {
    select?: usersSelect;
    include?: usersInclude;
    orderBy?: usersOrderByInput;
    skip?: number;
    after?: usersWhereUniqueInput;
    before?: usersWhereUniqueInput;
    first?: number;
    last?: number;
  }
) => {
  if (await can(tokenUserId, Authorizations.READ, "general"))
    return prisma.users.findMany({
      select,
      include,
      orderBy,
      skip,
      after,
      before,
      first,
      last
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

/**
 * Get an API key
 */
export const getServerLogsForUser = async (
  tokenUserId: string,
  query: {
    range?: string;
    from?: string;
  }
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
