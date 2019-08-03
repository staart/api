import { Request, Response } from "express";
import { verifyToken } from "./jwt";
import { Tokens } from "../interfaces/enum";

let trackingData: any[] = [];

export const getTrackingData = () => trackingData;
export const clearTrackingData = () => {
  trackingData = [];
};

export const trackUrl = async (req: Request, res: Response) => {
  if (req.method === "OPTIONS") return;
  const trackingObject = {
    date: new Date(),
    apiKey: req.get("X-Api-Key") || req.query.key,
    method: req.method,
    params: req.params,
    protocol: req.protocol,
    query: req.query,
    body: req.body,
    cookies: req.cookies,
    headers: req.headers,
    url: req.url,
    ...res.locals
  };
  if (trackingObject.apiKey) {
    try {
      const token = (await verifyToken(
        trackingObject.apiKey,
        Tokens.API_KEY
      )) as any;
      trackingObject.apiKeyId = token.id;
      trackingObject.apiKeyOrganizationId = token.organizationId;
      trackingObject.apiKeyJti = token.jti;
    } catch (error) {
      return;
    }
  }
  Object.keys(trackingObject).forEach(key => {
    if (
      typeof trackingObject[key] === "object" &&
      !Array.isArray(trackingObject[key]) &&
      !(trackingObject[key] instanceof Date)
    ) {
      trackingObject[key] = JSON.stringify(trackingObject[key]);
    }
    if (trackingObject[key] === undefined) delete trackingObject[key];
    if (trackingObject[key] === "{}") delete trackingObject[key];
  });
  res.on("finish", () => {
    trackingObject.statusCode = res.statusCode;
    trackingObject.completedDate = new Date();
    trackingData.push(trackingObject);
  });
};
