import { Request, Response } from "express";

let trackingData: any[] = [];

export const getTrackingData = () => trackingData;
export const clearTrackingData = () => {
  trackingData = [];
};

export const trackUrl = (req: Request, res: Response) => {
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
