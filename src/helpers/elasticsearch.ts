import { ELASTIC_INSTANCES_INDEX } from "../config";
import { logError } from "@staart/errors";
import { elasticSearch } from "@staart/elasticsearch";
import systemInfo from "systeminformation";
import pkg from "../../package.json";

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
