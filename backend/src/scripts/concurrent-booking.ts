const API_URL = "http://localhost:5000/api/bookings";

export {};

const requests = Array.from(
  { length: 11 },
  (_, index) =>
    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: {
          name: `Concurrent Parent ${index + 1}`,
          email: `concurrent-${index + 1}@example.com`,
          timezone: "America/New_York",
        },
        start: "2026-10-01T10:00:00",
      }),
    }),
);

const responses = await Promise.all(requests);

for (const [index, response] of responses.entries()) {
  const data = await response.json();

  console.log(`\nRequest ${index + 1}`);
  console.log(`HTTP ${response.status}`);
  console.log(JSON.stringify(data, null, 2));
}