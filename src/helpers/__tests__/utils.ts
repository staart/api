import {
  capitalizeEachFirstLetter,
  capitalizeFirstAndLastLetter,
  capitalizeFirstLetter,
  dateToDateTime,
  deleteSensitiveInfoUser,
  anonymizeIpAddress,
  createSlug
} from "../utils";

test("Capitalize name", () => {
  expect(capitalizeEachFirstLetter("anand chowdhary")).toBe("Anand Chowdhary");
});

test("Capitalize name", () => {
  expect(capitalizeFirstAndLastLetter("johannes van der waals")).toBe(
    "Johannes van der Waals"
  );
});

test("Capitalize first letter", () => {
  expect(capitalizeFirstLetter("anand chowdhary")).toBe("Anand chowdhary");
});

test("Convert date to MySQL datetime", () => {
  expect(dateToDateTime(new Date(1563170490000))).toBe("2019-07-15 06:01:30");
});

test("Remove sensitive info", () => {
  expect(
    deleteSensitiveInfoUser({
      id: "wiuhoeijpaoe",
      name: "Anand Chowdhary",
      password: "1abc9c"
    }).password
  ).toBeUndefined();
});

test("Anonymize an IP address", () => {
  expect(anonymizeIpAddress("103.101.26.51")).toBe("103.101.26.0");
});

test("Create a slug", () => {
  expect(createSlug("Anand Chowdhary")).toContain("anand-chowdhary-");
});
