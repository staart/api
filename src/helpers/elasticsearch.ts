import connectionClass from "http-aws-es";
import AWS from "aws-sdk";
import { Client } from "elasticsearch";
import {
  AWS_ELASTIC_ACCESS_KEY,
  AWS_ELASTIC_SECRET_KEY,
  AWS_ELASTIC_REGION,
  AWS_ELASTIC_HOST,
  ELASTIC_EVENTS_PREFIX,
  ELASTIC_INSTANCES_INDEX
} from "../config";
import { ErrorCode } from "../interfaces/enum";
import { logError } from "./errors";
import { getSystemInformation } from "./utils";

AWS.config.update({
  credentials: new AWS.Credentials(
    AWS_ELASTIC_ACCESS_KEY,
    AWS_ELASTIC_SECRET_KEY
  ),
  region: AWS_ELASTIC_REGION
});

export const elasticSearch = new Client({
  host: AWS_ELASTIC_HOST,
  connectionClass
});

getSystemInformation()
  .then(body =>
    elasticSearch.index({
      index: ELASTIC_INSTANCES_INDEX,
      body,
      type: "log"
    })
  )
  .then(() => {})
  .catch(() =>
    logError("ElasticSearch configuration error", "Unable to log event", 1)
  );

export const cleanElasticSearchQueryResponse = (response: any) => {
  if (response.hits && response.hits.hits) {
    const count = response.hits.total;
    const data = response.hits.hits;
    const newResponse: any = {
      data,
      count
    };
    if (count > data.length) {
      newResponse.hasMore = true;
    } else {
      newResponse.hasMore = false;
    }
    return newResponse;
  }
  throw new Error(ErrorCode.NOT_FOUND);
};
