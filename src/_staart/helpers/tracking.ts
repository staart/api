import { Request, Response } from "@staart/server";
import { Tokens } from "../interfaces/enum";
import { Event, Locals } from "../interfaces/general";
import { verifyToken } from "./jwt";

let trackingData: Array<any> = [];
let securityEventsData: Array<any> = [];

export const getTrackingData = () => trackingData;
export const getSecurityEvents = () => securityEventsData;
export const clearTrackingData = () => {
  trackingData = [];
};
export const clearSecurityEventsData = () => {
  securityEventsData = [];
};

export const trackEvent = (event: Event, locals?: Locals | any) => {
  event.date = new Date();
  if (locals) {
    event.ipAddress = locals.ipAddress;
    event.userAgent = locals.userAgent;
  }
  securityEventsData.push(event);
};

export const trackUrl = async (req: Request, res: Response) => {
  if (req.method === "OPTIONS") return;
  const trackingObject: { [index: string]: any } = {
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
    ipCountry: (req.get("cf-ipcountry") || "").toLowerCase(),
    ...res.locals,
  };
  if (typeof trackingObject.apiKey === "string") {
    try {
      const token = await verifyToken<any>(
        trackingObject.apiKey,
        Tokens.API_KEY
      );
      trackingObject.apiKeyId = token.id;
      trackingObject.apiKeyGroupId = token.groupId;
      trackingObject.apiKeyJti = token.jti;
      delete trackingObject.apiKey;
    } catch (error) {
      return;
    }
  }
  Object.keys(trackingObject).forEach((key) => {
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
