import { logError, success, warn } from "@staart/errors";
import { sendMail, setupTransporter } from "@staart/mail";
import { ELASTIC_INSTANCES_INDEX, TEST_EMAIL } from "./config";
import { elasticSearchIndex } from "./_staart/helpers/elasticsearch";
import { receiveEmailMessage } from "./_staart/helpers/mail";
import { prisma } from "./_staart/helpers/prisma";
import { elasticSearchEnabled } from "@staart/elasticsearch";
import { getProductPricing } from "@staart/payments";
import { redis } from "@staart/redis";
import pkg from "../package.json";

let numberOfFailedTests = 0;
interface Test {
  name: string;
  test(): Promise<void>;
}

class Redis implements Test {
  name = "Redis";
  async test() {
    await redis.set(pkg.name, "redis");
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
    await prisma.users.findMany({ take: 1 });
  }
}

class Stripe implements Test {
  name = "Stripe";
  async test() {
    const prices = await getProductPricing();
    success(`Got ${prices.data.length} pricing plans`);
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
    Stripe,
    ElasticSearch,
  ]) {
    const testClass = new TestClass();
    try {
      await testClass.test();
      success(testClass.name, "Test passed");
    } catch (error) {
      numberOfFailedTests += 1;
      logError(testClass.name, "Test failed", 1);
      console.log(error);
    }
  }
};

console.log();
runTests()
  .then(() =>
    numberOfFailedTests === 0
      ? success("All service tests passed")
      : logError("Service tests", "All service tests passed", 1)
  )
  .catch((error) => console.log("ERROR", error));
