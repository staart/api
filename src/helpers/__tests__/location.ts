import { getGeolocationFromIp } from "../location";

test("Gets a location from IP address", async () => {
  const location = await getGeolocationFromIp("103.101.26.51");
  expect(location).toBeDefined();
});

test("Gets city from IP address", async () => {
  const location = await getGeolocationFromIp("103.101.26.51");
  expect(location && location.city).toContain("Delhi");
});

test("Gets continent from IP address", async () => {
  const location = await getGeolocationFromIp("103.101.26.51");
  expect(location && location.continent).toBe("Asia");
});

test("Gets country from IP address", async () => {
  const location = await getGeolocationFromIp("103.101.26.51");
  expect(location && location.country_code).toBe("IN");
});

test("Gets timezone from IP address", async () => {
  const location = await getGeolocationFromIp("103.101.26.51");
  expect(location && location.time_zone).toBe("Asia/Kolkata");
});

test("Gets region from IP address", async () => {
  const location = await getGeolocationFromIp("103.101.26.51");
  expect(location && location.region_name).toBe(
    "National Capital Territory of Delhi"
  );
});
