import connectionClass from "http-aws-es";
import AWS from "aws-sdk";
import { Client } from "elasticsearch";
import {
  AWS_ELASTIC_ACCESS_KEY,
  AWS_ELASTIC_SECRET_KEY,
  AWS_ELASTIC_HOST
} from "../config";

AWS.config.update({
  credentials: new AWS.Credentials(
    AWS_ELASTIC_ACCESS_KEY,
    AWS_ELASTIC_SECRET_KEY
  ),
  region: "eu-west-3"
});

export const elasticSearch = new Client({
  host: AWS_ELASTIC_HOST,
  connectionClass
});
