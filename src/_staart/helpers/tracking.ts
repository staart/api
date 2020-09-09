import { Request, Response } from "@staart/server";
import { Tokens } from "../interfaces/enum";
import { Event, Locals } from "../interfaces/general";
import { verifyToken } from "./jwt";
import { config } from "@anandchowdhary/cosmic";

let trackingData: Array<any> = [];
let securityEventsData: Array<any> = [];

/** Get tracking data currently in memory */
export const getTrackingData = () => trackingData;

/** Get audit events currently in memory */
export const getSecurityEvents = () => securityEventsData;

/** Clear tracking data currently in memory */
export const clearTrackingData = () => (trackingData = []);

/** Clear audit events currently in memory */
export const clearSecurityEventsData = () => (securityEventsData = []);

/**
 * Track a new audit event
 * @param event - Event to track
 * @param locals - res.locals
 */
export const trackEvent = (event: Event, locals?: Locals | any) => {
  if (!config("trackAuditLogData")) return;
  event.date = new Date();
  if (locals) {
    event.ipAddress = locals.ipAddress;
    event.userAgent = locals.userAgent;
  }
  securityEventsData.push(event);
};

/**
 * Track a new HTTP request
 * @param req - Request
 * @param res - Response
 */
export const trackUrl = async (req: Request, res: Response) => {
  if (!config("trackRequestData")) return;
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
