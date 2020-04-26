import {
  cleanElasticSearchQueryResponse,
  elasticSearch,
} from "@staart/elasticsearch";
import { INSUFFICIENT_PERMISSION } from "@staart/errors";
import { ms } from "@staart/text";
import { ELASTIC_LOGS_INDEX } from "../../config";
import { can } from "../helpers/authorization";
import { SudoScopes } from "../interfaces/enum";
import { prisma, paginatedResult } from "../helpers/prisma";
import {
  organizationsSelect,
  organizationsInclude,
  organizationsOrderByInput,
  organizationsWhereUniqueInput,
  usersSelect,
  usersInclude,
  usersOrderByInput,
  usersWhereUniqueInput,
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
    last,
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
  if (await can(tokenUserId, SudoScopes.READ, "sudo"))
    return paginatedResult(
      await prisma.organizations.findMany({
        select,
        include,
        orderBy,
        skip,
        after,
        before,
        first,
        last,
      }),
      { first, last }
    );
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
    last,
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
  if (await can(tokenUserId, SudoScopes.READ, "sudo"))
    return paginatedResult(
      await prisma.users.findMany({
        select,
        include,
        orderBy,
        skip,
        after,
        before,
        first,
        last,
      }),
      { first, last }
    );
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
  if (!(await can(tokenUserId, SudoScopes.READ, "sudo")))
    throw new Error(INSUFFICIENT_PERMISSION);
  const range: string = query.range || "7d";
  const from = query.from ? parseInt(query.from) : 0;
  const result = await elasticSearch.search({
    index: ELASTIC_LOGS_INDEX,
    from,
    body: {
      query: {
        bool: {
          must: [
            {
              range: {
                date: {
                  gte: new Date(new Date().getTime() - ms(range)),
                },
              },
            },
          ],
        },
      },
      sort: [
        {
          date: { order: "desc" },
        },
      ],
      size: 10,
    },
  });
  return cleanElasticSearchQueryResponse(result.body, 10);
};
