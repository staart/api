import connectionClass from "http-aws-es";
import AWS from "aws-sdk";
import { Client } from "elasticsearch";
import {
  AWS_ELASTIC_ACCESS_KEY,
  AWS_ELASTIC_SECRET_KEY,
  AWS_ELASTIC_REGION,
  AWS_ELASTIC_HOST,
  ELASTIC_INSTANCES_INDEX
} from "../config";
import { RESOURCE_NOT_FOUND } from "@staart/errors";
import { logError } from "./errors";
import systemInfo from "systeminformation";
import pkg from "../../package.json";

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

const getSystemInformation = async () => {
  return {
    system: await systemInfo.system(),
    time: systemInfo.time(),
    cpu: await systemInfo.cpu(),
    osInfo: await systemInfo.osInfo(),
    package: {
      name: pkg.name,
      version: pkg.version,
      repository: pkg.repository,
      author: pkg.author,
      "staart-version": pkg["staart-version"]
    }
  };
};

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
  throw new Error(RESOURCE_NOT_FOUND);
};
