import { success } from "@staart/errors";
import geolite2 from "geolite2-redist";
import maxmind, { CityResponse, Reader } from "maxmind";

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

let lookup: Reader<CityResponse> | undefined = undefined;
const getLookup = async () => {
  if (lookup) return lookup;
  lookup = await geolite2.open<CityResponse>("GeoLite2-City", (path) => {
    return maxmind.open(path);
  });
  success("Opened GeoIP2 database reader");
  return lookup;
};

export const getGeolocationFromIp = async (
  ipAddress: string
): Promise<GeoLocation | undefined> => {
  try {
    const lookup = await getLookup();
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
    return location;
  } catch (error) {}
};
