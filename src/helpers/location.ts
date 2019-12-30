import maxmind, { CityResponse } from "maxmind";
import { join } from "path";
import { Event } from "../interfaces/tables/events";
import { Session } from "../interfaces/tables/user";
import { getItemFromCache, storeItemInCache } from "./cache";
import { CacheCategories } from "../interfaces/enum";

const GEOLOCATION_PATH = join("lfs/GeoLite2-City.mmdb");

export interface GeoLocation {
  city?: string;
  country_code?: string;
  continent?: string;
  latitude?: number;
  longitude?: number;
  time_zone?: string;
  accuracy_radius?: number;
  zip_code?: string;
  region_name?: string;
}
export const getGeolocationFromIp = async (
  ipAddress: string
): Promise<GeoLocation | undefined> => {
  const cachedLookup = getItemFromCache(CacheCategories.IP_LOOKUP, ipAddress);
  if (cachedLookup) return cachedLookup as GeoLocation;
  const lookup = await maxmind.open<CityResponse>(GEOLOCATION_PATH);
  const ipLookup = lookup.get(ipAddress);
  if (!ipLookup) return;
  const location: any = {};
  if (ipLookup.city) location.city = ipLookup.city.names.en;
  if (ipLookup.continent) location.continent = ipLookup.continent.names.en;
  if (ipLookup.country) location.country_code = ipLookup.country.iso_code;
  if (ipLookup.location) location.latitude = ipLookup.location.latitude;
  if (ipLookup.location) location.longitude = ipLookup.location.longitude;
  if (ipLookup.location) location.time_zone = ipLookup.location.time_zone;
  if (ipLookup.location)
    location.accuracy_radius = ipLookup.location.accuracy_radius;
  if (ipLookup.postal) location.zip_code = ipLookup.postal.code;
  if (ipLookup.subdivisions)
    location.region_name = ipLookup.subdivisions[0].names.en;
  if (ipLookup.subdivisions)
    location.region_code = ipLookup.subdivisions[0].iso_code;
  storeItemInCache(CacheCategories.IP_LOOKUP, ipAddress, location);
  return location;
};

export const addLocationToEvents = async (events: Event[]) => {
  for await (let event of events) {
    event = await addLocationToEvent(event);
  }
  return events;
};

export const addLocationToEvent = async (event: Event) => {
  if (event.ipAddress) {
    event.location = await getGeolocationFromIp(event.ipAddress);
  }
  return event;
};

export const addLocationToSessions = async (sessions: Session[]) => {
  for await (let session of sessions) {
    session = await addLocationToSession(session);
  }
  return sessions;
};

export const addLocationToSession = async (session: Session) => {
  if (session.ipAddress) {
    session.location = await getGeolocationFromIp(session.ipAddress);
  }
  return session;
};
