import { DateTime } from "luxon";

const cases = [
  {
    name: "Spring forward - nonexistent time",
    input: "2027-03-14T02:30:00",
    timezone: "America/New_York",
  },
  {
    name: "Fall back - ambiguous time",
    input: "2026-11-01T01:30:00",
    timezone: "America/New_York",
  },
];

for (const testCase of cases) {
  const result = DateTime.fromISO(
    testCase.input,
    {
      zone: testCase.timezone,
      setZone: true,
    },
  );

  console.log("\n-----------------------------");
  console.log(testCase.name);
  console.log("Input:", testCase.input);
  console.log("Zone:", testCase.timezone);
  console.log("Valid:", result.isValid);
  console.log("Reason:", result.invalidReason);
  console.log("Result:", result.toISO());
  console.log("Offset:", result.offset);
}