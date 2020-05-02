import {
  cleanElasticSearchQueryResponse,
  elasticSearch,
} from "@staart/elasticsearch";
import { INSUFFICIENT_PERMISSION } from "@staart/errors";
import { ms } from "@staart/text";
import { ELASTIC_LOGS_INDEX } from "../../config";
import { can } from "../helpers/authorization";
import { SudoScopes } from "../interfaces/enum";
import {
  prisma,
  paginatedResult,
  queryParamsToSelect,
} from "../helpers/prisma";
import { couponCodeJwt } from "../helpers/jwt";
import {
  organizationsSelect,
  organizationsInclude,
  organizationsOrderByInput,
  organizationsWhereUniqueInput,
  usersSelect,
  usersInclude,
  usersOrderByInput,
  usersWhereUniqueInput,
  coupon_codesUpdateInput,
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

export const getAllCouponsForUser = async (
  tokenUserId: string,
  queryParams: any
) => {
  if (await can(tokenUserId, SudoScopes.READ, "sudo"))
    return paginatedResult(
      await prisma.coupon_codes.findMany(queryParamsToSelect(queryParams)),
      { first: queryParams.first, last: queryParams.last }
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getCouponForUser = async (
  tokenUserId: string,
  couponId: string
) => {
  if (await can(tokenUserId, SudoScopes.READ, "sudo"))
    return prisma.coupon_codes.findOne({ where: { id: parseInt(couponId) } });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateCouponForUser = async (
  tokenUserId: string,
  couponId: string,
  data: coupon_codesUpdateInput
) => {
  if (await can(tokenUserId, SudoScopes.READ, "sudo"))
    return prisma.coupon_codes.update({
      data,
      where: { id: parseInt(couponId) },
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteCouponForUser = async (
  tokenUserId: string,
  couponId: string
) => {
  if (await can(tokenUserId, SudoScopes.READ, "sudo"))
    return prisma.coupon_codes.delete({ where: { id: parseInt(couponId) } });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const generateCouponForUser = async (tokenUserId: string, body: any) => {
  if (!(await can(tokenUserId, SudoScopes.READ, "sudo")))
    throw new Error(INSUFFICIENT_PERMISSION);
  if (body.jwt)
    return couponCodeJwt(body.amount, body.currency, body.description);
  return prisma.coupon_codes.create({
    data: body,
  });
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
