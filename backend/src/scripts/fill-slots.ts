const API_URL = "http://localhost:5000/api/bookings";

export {};

const SLOT = "2026-09-28T10:00:00";

for (let i = 1; i <= 9; i++) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: {
        name: `Capacity Test ${i}`,
        email: `capacity-test-${i}@example.com`,
        timezone: "America/New_York",
      },
      start: SLOT,
    }),
  });

  const data = await response.json();

  console.log(`\nRequest ${i}`);
  console.log(`HTTP ${response.status}`);
  console.log(JSON.stringify(data, null, 2));
}