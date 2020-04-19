import { logError, success, warn } from "@staart/errors";
import { sendMail, setupTransporter } from "@staart/mail";
import redis from "@staart/redis";
import systemInfo from "systeminformation";
import pkg from "../package.json";
import { ELASTIC_INSTANCES_INDEX, TEST_EMAIL } from "./config";
import { elasticSearchIndex } from "./helpers/elasticsearch";
import { receiveEmailMessage } from "./helpers/mail";
import { prisma } from "./helpers/prisma";
import { elasticSearchEnabled } from "@staart/elasticsearch";

interface Test {
  name: string;
  test(): Promise<void>;
}

class Redis implements Test {
  name = "Redis";
  async test() {
    await redis.set(pkg.name, systemInfo.time().current);
    await redis.del(pkg.name);
  }
}
class RedisQueue implements Test {
  name = "Redis Message Queue";
  async test() {
    await receiveEmailMessage();
  }
}

class Database implements Test {
  name = "Database connection";
  async test() {
    await prisma.users.findMany({ first: 1 });
  }
}

class Email implements Test {
  name = "Email";
  async test() {
    setupTransporter();
    await sendMail({
      to: TEST_EMAIL,
      subject: "Test from Staart",
      message: `This is an example email to test your Staart email configuration.\n\n${JSON.stringify(
        {
          time: systemInfo.time(),
          package: {
            name: pkg.name,
            version: pkg.version,
            repository: pkg.repository,
            author: pkg.author,
            "staart-version": pkg["staart-version"],
          },
        }
      )}`,
    });
  }
}

class ElasticSearch implements Test {
  name = "ElasticSearch";
  async test() {
    if (!elasticSearchEnabled) {
      warn("ElasticSearch is disabled");
      return;
    }
    await elasticSearchIndex({
      index: ELASTIC_INSTANCES_INDEX,
      body: {
        name: pkg.name,
        version: pkg.version,
        repository: pkg.repository,
        author: pkg.author,
        "staart-version": pkg["staart-version"],
      },
    });
  }
}

const runTests = async () => {
  for await (const TestClass of [
    Redis,
    RedisQueue,
    Database,
    Email,
    ElasticSearch,
  ]) {
    const testClass = new TestClass();
    try {
      await testClass.test();
      success(testClass.name, "Test passed");
    } catch (error) {
      logError(testClass.name, "Test failed", 1);
    }
  }
};

console.log();
runTests()
  .then(() => success("All service tests passed"))
  .catch((error) => console.log("ERROR", error));
