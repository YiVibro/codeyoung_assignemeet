# AI Development Transcript — CodeYoung Trial Booking System

> **Purpose:** This document preserves the AI-assisted development history of the CodeYoung Trial Class Booking System.
>
> It contains the actual user prompts/queries and AI responses used during development, followed by implementation, debugging, testing, and design-evolution discussions where those appear in the source transcript.
>
> The transcript is organized chronologically for readability. It is **not** rewritten as a retrospective project summary. Design changes and corrections are intentionally retained because they show how the implementation evolved during development.
>

---

## Contents

1. [Session 1 — Requirements & Architecture]
2. [Session 2 — Database Schema & Concurrency Design]
3. [Session 3 — Prisma Schema and Database Setup]
4. [Session 4 — Availability Engine Design]
5. [Session 5 — Booking Service and Concurrency Strategy]
6. [Session 6 — Backend Implementation]
7. [Session 7 — Booking Endpoint and Transactional Concurrency]
8. [Session 8 — Frontend Booking Experience]
9. [Session 9 — End-to-End Testing and Edge-Case Validation]

---

# AI Development Transcript — Codeyoung Trial Booking System

> **LLM used:** ChatGPT

# Session 1 — Requirements & Architecture
**Date:** 25 Sept 2026

**Goal:** Lock down functional/non-functional requirements and system design before coding

## User Prompt
I'm building a full-stack assignment for a company called Codeyoung. Here's the exact task brief:

At Codeyoung, parents have the option to book a “trial class” to experience our product and the quality coaching our mentors provide before signing up.

This is the flow parents usually go through:

1.    Parents pick a time slot that’s comfortable for them.

2.    We assign an available mentor

3.    We email both the mentor and the parent a link that takes them to a live class.

**The task is to build a similar appointment-booking system which has:**

·       10 mentors available for trial classes

·       20 parents interested in booking a trial class per day

Build a web app that parents can use to book this trial class. You should use NodeJS or Python for any backend APIs and React for the frontend.

Feel free to use any other backend or frontend libraries.

**Requirements:**

1.    Mentors and parents may be in different time zones. Usually, parents are in the US or UK, and mentors are in India. Please make sure local times are always displayed and communicated to them.

2.    Daylight Savings Time is a niggle you have to handle.

3.    Parents and mentors can receive a dummy link. It’s assumed that the link will work and will take them to a demo class.

4.    Mentors have at most 2 demo classes a day.

5.    If no mentors are available, use your judgment to communicate an appropriate error state.

I want to build this as a small, production-quality system, not a toy CRUD app. Before writing any code, help me lock down a formal requirements spec. Please cover:

1. Functional requirements (parent flow, mentor flow, booking flow)
2. Non-functional requirements and constraints (timezone correctness, DST handling, concurrency/double-booking prevention, capacity limits)
3. Explicit assumptions I need to state (e.g., how "20 parents/day" relates to "10 mentors × 2 classes/day", mentor working hours, slot granularity)
4. Edge cases I need to handle (no mentor available, slot taken between viewing and booking, invalid/past times, timezone edge cases around DST transitions)
5. A proposed architecture: frontend, backend, database, and how they communicate
6. A database schema that stores time as UTC and models mentor availability, capacity, and bookings correctly
7. What I should deliberately NOT build, given the evaluation criteria explicitly rewards good scoping

Tech constraints: backend in Node.js or Python, frontend in React. I'm comfortable with either JavaScript or TypeScript recommend which one and explain why given a \~72-hour deadline.

Don't write implementation code yet ,I want the spec and architecture nailed down first so I can review and adjust before we build.
es for documentation,you understand right.

## AI Response
The assignment is best approached as a small production-quality appointment-booking system rather than a basic CRUD application. The core engineering challenges are not the React screens themselves, but correctly modeling appointment availability, time zones, daylight-saving transitions, mentor capacity, and concurrent booking attempts.

1. Functional Requirements
Parent flow

A parent should be able to:

Open the trial-class booking page.
Select or confirm their IANA time zone, such as:
America/New_York
Europe/London
Asia/Kolkata
Select a future date.
View available one-hour trial-class slots in their own local time.
Select a slot.
Enter basic details such as name and email.
Confirm the booking.
Receive a confirmation containing:
Mentor name
Trial-class date and time in the parent's timezone
Mentor's corresponding local date and time
Dummy class/meeting link

The parent should not need to understand UTC or timezone conversion. Those are implementation details.

Mentor flow

The system has 10 mentors.

A mentor should be able to view their assigned trial classes and see:

Parent information
Class date/time in the mentor's timezone
Class status
Dummy class link

A full mentor-management system or authentication system is not necessary for this assignment unless it adds meaningful value.

Booking flow

The backend should:

Receive the parent's requested local date/time and timezone.
Convert that local time to a canonical UTC instant.
Find mentors who are available at that instant.
Exclude mentors who have already reached their daily limit.
Assign an available mentor.
Create the booking atomically.
Generate a dummy meeting link.
Return the booking confirmation.

The frontend must not be responsible for deciding whether a booking is actually valid.

2. Non-Functional Requirements
Timezone correctness

The system should use IANA timezone identifiers rather than manually storing UTC offsets.

For example:

America/New_York
Europe/London
Asia/Kolkata

The database should store appointment instants in UTC.

The UI should convert those instants into the relevant user's timezone when displaying them.

Conceptually:

Parent local time
       ↓
IANA timezone conversion
       ↓
UTC instant
       ↓
Database
       ↓
Convert to display timezone

This prevents timezone calculations from becoming dependent on hard-coded offsets.

Daylight Saving Time

DST must be handled by a timezone-aware date/time library rather than manually adding or subtracting offsets.

For example, America/New_York does not have the same UTC offset throughout the year.

The application should therefore calculate the offset based on:

timezone + actual date/time

rather than assuming:

America/New_York = UTC-5

permanently.

DST transition dates also need to be included in testing.

3. Concurrency and Double Booking

This is an important requirement that should not be solved merely by saying "use a database transaction."

PostgreSQL's default READ COMMITTED isolation level allows two concurrent transactions to potentially read the same mentor as available before either transaction commits.

Therefore, the database should enforce important booking invariants.

For example:

UNIQUE (mentor_id, start_time_utc)

prevents the same mentor from being assigned to two bookings with the same start time.

The booking operation should use a transaction and handle a uniqueness conflict by either:

Trying another available mentor, or
Returning a clear "slot no longer available" response if no mentor remains.

The mentor's daily two-class limit must also be protected against concurrent booking attempts. This may require row-level locking or another appropriate PostgreSQL concurrency strategy in addition to the unique constraint.

The important principle is:

The database must remain the final authority over booking consistency.

4. Capacity Requirements

There are:

10 mentors
×
2 classes per mentor per day
=
20 maximum classes per day

This naturally corresponds to the requirement that approximately 20 parents may be interested in booking each day.

I would document this as an assumption rather than interpreting "20 parents" as requiring exactly 20 parent accounts.

If all 10 mentors have already reached their daily limit, the system should communicate that no further slots are available and provide an alternative such as another date.

5. Explicit Assumptions

The assignment leaves several details unspecified, so these should be documented clearly rather than hidden inside the implementation.

Trial-class duration

Assume:

60 minutes

This makes slot availability and mentor conflict detection deterministic.

Slot granularity

Use fixed one-hour slots rather than allowing parents to enter arbitrary times.

For example:

09:00–10:00
10:00–11:00
11:00–12:00
...
Mentor working hours

A reasonable MVP assumption is:

Monday–Saturday
09:00–21:00 IST

with Sunday unavailable.

This should be configurable in the database rather than hard-coded throughout the application.

Mentor timezone

The initial mentors are assumed to be located in India and therefore use:

Asia/Kolkata
Parent accounts

Full authentication is not required. A parent can provide basic information such as:

Name
Email
Timezone

when making a booking.

Email

Actual email delivery is not necessary because the assignment explicitly allows a dummy link. The application can simulate the notification and display the generated meeting link.

6. Important Edge Cases

The system should explicitly handle at least the following cases.

No mentor available

If every mentor is unavailable or has reached their daily limit:

No mentors are available for this time.
Please select another time or date.

The API should return an appropriate non-500 response.

Slot taken while booking

A parent might see:

10:00 AM — Available

and another parent could book it before the first parent confirms.

The booking request must therefore re-check availability on the backend.

The parent should receive something like:

This slot was just booked by another parent.
Please choose another available time.
Past time

Past dates and past slots on the current date must be rejected by the backend.

Invalid timezone

The backend should validate the supplied IANA timezone.

DST spring-forward transition

Some local times do not exist during a DST transition.

The application should not silently interpret an invalid local time as another appointment.

DST fall-back transition

Some local times occur twice during a DST transition.

The system needs a deterministic way to resolve the local time into an actual instant.

Using a proper timezone-aware library and canonical UTC storage is important here.

Mentor's local day vs UTC day

The two-class-per-day rule must be evaluated according to the mentor's local calendar day, not simply:

DATE(start_time_utc)

because UTC midnight may not correspond to midnight in India.

Duplicate requests

A user may accidentally click the booking button twice. The backend should prevent duplicate bookings and handle repeated requests safely.

7. Proposed Architecture

A modular monolith is appropriate for this assignment.

┌──────────────────────────────┐
│        React Frontend        │
│                              │
│ Booking UI                   │
│ Timezone selection           │
│ Slot selection               │
│ Confirmation                 │
└──────────────┬───────────────┘
               │
             REST
               │
┌──────────────▼───────────────┐
│      Node.js / Express       │
│                              │
│ Routes                       │
│ Controllers                  │
│ Booking Service              │
│ Availability Service         │
│ Timezone utilities           │
│ Validation                   │
└──────────────┬───────────────┘
               │
┌──────────────▼───────────────┐
│          PostgreSQL          │
│                              │
│ Parents                      │
│ Mentors                      │
│ Availability                 │
│ Bookings                     │
│ Constraints                  │
└──────────────────────────────┘

A modular monolith is preferable to microservices here because the application is small and the assignment rewards appropriate scope.

8. Backend Architecture

A reasonable structure is:

src/
├── config/
├── controllers/
├── middleware/
├── repositories/
├── routes/
├── schemas/
├── services/
├── utils/
├── app.ts
└── server.ts

The main responsibility boundaries would be:

HTTP request
     ↓
Controller
     ↓
Service
     ↓
Repository
     ↓
PostgreSQL

The booking service should contain the business rules rather than placing them directly inside route handlers.

9. Database Schema

A conceptual schema could be:

Parent
------
id
name
email
timezone
created_at


Mentor
------
id
name
email
timezone
active
created_at


MentorAvailability
------------------
id
mentor_id
day_of_week
start_time
end_time


Booking
-------
id
parent_id
mentor_id
start_time_utc
end_time_utc
parent_timezone
status
meeting_link
created_at

Relationships:

Parent 1 ──────── N Booking N ──────── 1 Mentor
                                      │
                                      │
                                      N
                              MentorAvailability

The booking stores the parent's timezone as it existed when the booking was made. This preserves historical information if the parent's profile timezone changes later.

The canonical appointment time is stored as UTC.

A database constraint such as:

UNIQUE (mentor_id, start_time_utc)

should protect against duplicate mentor assignments at the same time.

10. API Design

A simple REST API is sufficient.

Potential endpoints:

GET  /api/availability
POST /api/bookings
GET  /api/bookings/:id
POST /api/bookings/:id/cancel
GET  /api/mentors/:id/bookings
GET  /api/health

The frontend communicates only with the backend API.

The frontend should never directly access PostgreSQL.

11. Technology Recommendation

I recommend TypeScript rather than plain JavaScript.

The reasoning is:

The project has several related domain objects.
Timezone and booking data contain many fields where mistakes are easy.
API request/response types benefit from compile-time checking.
Prisma integrates well with TypeScript.
TypeScript makes the service/repository boundaries clearer.
The project is small enough that TypeScript's additional setup should not significantly slow development.

A suitable stack would therefore be:

Frontend:
React
Vite
TypeScript
Tailwind CSS
React Router
Luxon

Backend:
Node.js
Express
TypeScript
Prisma
Zod
Luxon

Database:
PostgreSQL

For a 72-hour assignment, this is still lightweight enough while providing stronger maintainability than plain JavaScript.

12. What Should Deliberately NOT Be Built

The evaluation specifically values good scope decisions.

I would deliberately avoid:

Real Zoom/Google Meet integration
Real email infrastructure
Payment processing
OAuth
Complex parent authentication
SMS notifications
Mobile application
Microservices
Kubernetes
Kafka/RabbitMQ
AI-based mentor matching
Complex admin CMS
Real-time chat
External calendar synchronization

These features would consume development time without materially improving the core assignment.

A polished booking workflow with correct timezone handling, concurrency protection, capacity management, testing, and good UX is more valuable than a large number of unrelated features.

13. Testing Strategy

The core business logic should be tested independently of the UI.

Important tests include:

Timezone conversion
DST transition
Past slot rejection
Mentor availability
Two-class daily limit
Booking creation
Cancellation
Concurrent booking attempts
Duplicate booking attempts
Fully booked capacity
Invalid timezone

A particularly important integration test is:

Multiple parents attempt to book the same slot
simultaneously
        ↓
Only valid bookings are committed
        ↓
No mentor is double-booked
Recommended Scope

The final system should therefore focus on five things:

1. Good parent booking experience
2. Correct timezone/DST handling
3. Correct mentor assignment and capacity
4. Safe concurrent booking
5. Clean, understandable engineering

Everything else should remain secondary.


# Session 2 — Database Schema & Concurrency Design
**Date:**25 Sept 2026
## User Prompt
Give database design and schemas.Also consider concurrency in the design.
## AI Response
## AI Response

Now that the requirements are locked down, the next step is to design the database model carefully before implementing the booking API.

The key principle is that **the database should represent the business rules**, not merely store whatever the frontend sends.

### 1. Core entities

We need four main entities:

```text
Parent
Mentor
MentorAvailability
Booking
```

The relationship is:

```text
Parent 1 ──────── N Booking N ──────── 1 Mentor
                                      │
                                      │
                                      N
                              MentorAvailability
```

---

### 2. Parent

A parent needs only the information required to make and identify a booking.

```text
Parent
------
id
name
email
timezone
created_at
```

`timezone` should contain an IANA timezone such as:

```text
America/New_York
Europe/London
Asia/Kolkata
```

We should not store only an offset such as `UTC-5`, because the offset does not contain DST rules.

---

### 3. Mentor

```text
Mentor
------
id
name
email
timezone
active
created_at
```

For the initial dataset, all mentors can use:

```text
Asia/Kolkata
```

The `active` field allows a mentor to be temporarily excluded without deleting their historical bookings.

---

### 4. Mentor availability

Availability should not be hard-coded into the booking service.

Instead:

```text
MentorAvailability
------------------
id
mentor_id
day_of_week
start_time
end_time
```

For example:

```text
Mentor 1
Monday
09:00
21:00
```

The same mentor can have multiple availability records if their schedule changes by day.

This gives us a simple recurring weekly schedule without requiring an unnecessarily complicated calendar system.

---

### 5. Booking

The booking is the most important entity.

```text
Booking
-------
id
parent_id
mentor_id
start_time_utc
end_time_utc
parent_timezone
status
meeting_link
created_at
```

The canonical appointment time is:

```text
start_time_utc
end_time_utc
```

The parent's timezone is also stored on the booking.

This is intentional.

If a parent later changes their profile timezone, an old booking should still be reproducible exactly as it was originally booked.

---

### 6. Booking status

For the MVP:

```text
CONFIRMED
CANCELLED
```

is enough.

We don't need a complicated state machine because there is no payment or approval process.

A cancelled booking should no longer consume the mentor's daily capacity.

---

### 7. Important database constraints

The application should not rely entirely on application-level checks.

The database should enforce important invariants.

### Constraint 1 — Unique mentor/start time

```sql
UNIQUE (mentor_id, start_time_utc)
```

This prevents:

```text
Mentor 1
10:00 UTC
Booking A

Mentor 1
10:00 UTC
Booking B
```

from both being committed.

This is the final protection against a same-slot race.

---

### Constraint 2 — Valid relationships

Foreign keys should ensure:

```text
Booking.parent_id → Parent.id
Booking.mentor_id → Mentor.id
MentorAvailability.mentor_id → Mentor.id
```

We should not allow orphaned bookings.

---

### Constraint 3 — Valid status

Booking status should be restricted to the defined values.

With Prisma this can be represented using an enum.

---

### 8. The two-class-per-day rule

This is harder than the unique constraint.

We need to enforce:

> A mentor may have at most two confirmed classes during their local calendar day.

We cannot simply use:

```sql
COUNT(*) < 2
```

without considering concurrency.

Two simultaneous transactions could both observe:

```text
Mentor 1 has 1 booking
```

and both conclude that a second booking is allowed.

We therefore need a concurrency-safe strategy.

---

### 9. Proposed concurrency strategy

For this assignment, I would use a **transaction with row-level locking on the mentor**.

Conceptually:

```text
BEGIN
   │
   ▼
SELECT mentor
FOR UPDATE
   │
   ▼
Check mentor's bookings
for their local calendar day
   │
   ├── already 2 → reject this mentor
   │
   └── fewer than 2
            │
            ▼
      Create booking
            │
            ▼
          COMMIT
```

`FOR UPDATE` means that another transaction attempting to modify/lock the same mentor must wait until the first transaction finishes.

This prevents two concurrent requests from both observing the mentor as having only one class and both creating a second class.

---

### 10. Combining row locking with the unique constraint

We should use both.

### Row lock

Protects the mentor's daily capacity decision.

### Unique constraint

Protects the specific mentor/time combination.

Therefore:

```text
                 Booking Request
                       │
                       ▼
                BEGIN TRANSACTION
                       │
                       ▼
                Lock mentor row
                       │
                       ▼
             Check daily capacity
                       │
                       ▼
              Check slot conflict
                       │
                       ▼
                 Create booking
                       │
                       ▼
                     COMMIT
```

The database provides defense in depth.

---

### 11. Mentor assignment under concurrency

Suppose the requested slot is:

```text
10:00–11:00
```

and three mentors are available.

The service can determine candidates:

```text
Mentor 1
Mentor 2
Mentor 3
```

Then attempt assignment within a transaction.

If Mentor 1 becomes unavailable because another transaction books them first, the service can attempt Mentor 2.

If no candidates remain, the request returns:

```text
409 Conflict
```

with a user-friendly message such as:

> This time slot was just booked. Please choose another available slot.

The frontend should translate that into a friendly UI state rather than displaying a raw database error.

---

### 12. Fixed slot duration simplifies concurrency

Because we have decided that every trial class is:

```text
60 minutes
```

we don't need to support arbitrary appointment lengths.

Therefore:

```text
start_time_utc
+
1 hour
=
end_time_utc
```

This also means that:

```text
UNIQUE(mentor_id, start_time_utc)
```

is sufficient for preventing two bookings in the same predefined slot.

If arbitrary appointment durations were supported later, we would need stronger overlap detection, potentially using PostgreSQL range/exclusion constraints.

That complexity is unnecessary for this assignment.

---

### 13. Mentor's local calendar day

This is another important detail.

Suppose:

```text
start_time_utc =
2026-09-28 00:30 UTC
```

For an Indian mentor:

```text
Asia/Kolkata
```

this could be:

```text
September 28, 06:00 IST
```

The daily capacity check therefore needs to determine the date in:

```text
mentor.timezone
```

rather than simply using the UTC date.

Conceptually:

```text
UTC instant
     ↓
mentor timezone
     ↓
mentor local date
     ↓
count confirmed bookings
```

This avoids incorrect capacity calculations around UTC midnight.

---

### 14. Availability calculation

We should not store every possible future slot in the database.

Instead, availability can be calculated from:

```text
MentorAvailability
+
Requested date
+
Mentor timezone
+
Existing bookings
```

For example:

```text
Mentor schedule:
Monday 09:00–21:00
```

The backend generates the possible hourly slots for that date, converts them to UTC, and checks which mentors can accept each slot.

This avoids creating thousands of unnecessary slot records.

---

### 15. Database design

The resulting model is:

```text
┌────────────────────┐
│       Parent       │
├────────────────────┤
│ id PK              │
│ name               │
│ email              │
│ timezone           │
│ created_at         │
└─────────┬──────────┘
          │
          │ 1:N
          │
┌─────────▼──────────┐
│      Booking       │
├────────────────────┤
│ id PK              │
│ parent_id FK       │
│ mentor_id FK       │
│ start_time_utc     │
│ end_time_utc       │
│ parent_timezone    │
│ status             │
│ meeting_link       │
│ created_at         │
└─────────┬──────────┘
          │
          │ N:1
          │
┌─────────▼──────────┐
│       Mentor       │
├────────────────────┤
│ id PK              │
│ name               │
│ email              │
│ timezone           │
│ active             │
│ created_at         │
└─────────┬──────────┘
          │
          │ 1:N
          │
┌─────────▼────────────────┐
│   MentorAvailability     │
├──────────────────────────┤
│ id PK                    │
│ mentor_id FK             │
│ day_of_week              │
│ start_time               │
│ end_time                 │
└──────────────────────────┘
```

---

### 16. Prisma model direction

The Prisma schema should reflect these concepts with:

* UUID or integer primary keys
* foreign keys
* enums for booking status
* indexes on frequently queried fields
* unique constraint on mentor/start time
* timestamps

Important indexes will include:

```text
Booking:
    mentor_id
    start_time_utc
    parent_id
```

and potentially a composite index for mentor/date queries.

We should let PostgreSQL handle the actual constraints rather than attempting to reproduce them entirely in application code.

---

### 17. One deliberate design choice

I would **not create a `Slot` table** for the initial version.

A `Slot` table might look attractive:

```text
Slot
----
id
start_time
end_time
mentor_id
status
```

but it introduces unnecessary complexity because our slots are deterministic from mentor availability.

The simpler model is:

```text
Availability rules
       +
Existing bookings
       =
Available slots
```

This is easier to maintain and explain.

---

### 18. Database transaction boundary

The transaction should encompass the actual assignment and booking creation.

Conceptually:

```text
BEGIN

1. Find candidate mentor
2. Lock candidate mentor
3. Re-check daily capacity
4. Re-check requested slot
5. Insert booking
6. Commit

```

The critical principle is:

> **Never trust an availability result that was calculated before the transaction.**

The frontend's availability screen is only a convenience for the user. The booking endpoint must perform its own authoritative validation.

---

### 19. Resulting engineering model

The system now has three layers of protection:

```text
                 Availability UI
                       │
                       ▼
              Backend validation
                       │
                       ▼
            Transaction + row lock
                       │
                       ▼
             Database constraints
```

This is preferable to relying on any single layer.


# Session 3 — Prisma Schema and Database Setup

## User Prompt
creating the actual Prisma schema, running the first migration, and seeding the 10 mentors with their availability schedules.

## AI Response
### 1. Prisma schema

The core models should be:

```text
Parent
Mentor
MentorAvailability
Booking
```

We should also use an enum for booking status:

```text
CONFIRMED
CANCELLED
```

A suitable Prisma model structure is:

```prisma
enum BookingStatus {
  CONFIRMED
  CANCELLED
}

model Parent {
  id        String    @id @default(uuid())
  name      String
  email     String
  timezone  String
  createdAt DateTime  @default(now())

  bookings  Booking[]
}

model Mentor {
  id           String               @id @default(uuid())
  name         String
  email        String               @unique
  timezone     String
  active       Boolean              @default(true)
  createdAt    DateTime             @default(now())

  availability MentorAvailability[]
  bookings     Booking[]

  @@index([active])
}

model MentorAvailability {
  id         String   @id @default(uuid())
  mentorId   String
  dayOfWeek  Int
  startTime  String
  endTime    String

  mentor Mentor @relation(fields: [mentorId], references: [id], onDelete: Cascade)

  @@index([mentorId, dayOfWeek])
}

model Booking {
  id              String        @id @default(uuid())
  parentId        String
  mentorId        String
  startTimeUtc    DateTime
  endTimeUtc      DateTime
  parentTimezone  String
  status          BookingStatus @default(CONFIRMED)
  meetingLink     String        @unique
  createdAt       DateTime      @default(now())

  parent Parent @relation(fields: [parentId], references: [id], onDelete: Restrict)
  mentor Mentor @relation(fields: [mentorId], references: [id], onDelete: Restrict)

  @@unique([mentorId, startTimeUtc])
  @@index([mentorId, startTimeUtc])
  @@index([parentId])
}
```

The actual Prisma version and PostgreSQL version should be checked against the versions installed in the project before finalizing the migration.

---

### 2. Why the schema is structured this way

#### Parent

The parent's timezone is stored because it is required for displaying the booking correctly.

The booking also stores `parentTimezone`.

This may look redundant, but it serves two different purposes:

```text
Parent.timezone
    ↓
Current profile preference

Booking.parentTimezone
    ↓
Historical value used when this booking was created
```

That means changing a parent's timezone later won't rewrite historical booking information.

---

### 3. Mentor availability

We use:

```text
dayOfWeek
startTime
endTime
```

rather than creating individual future slots.

For example:

```text
mentorId: Mentor 1
dayOfWeek: Monday
startTime: 09:00
endTime: 21:00
```

The availability service can generate hourly slots from this rule.

The values are interpreted in the mentor's timezone.

---

### 4. Why availability time isn't stored as UTC

A recurring schedule such as:

```text
Monday 09:00–21:00
```

is inherently a **local-time rule**.

If we stored it as UTC, DST could cause the effective local schedule to shift.

Therefore:

```text
Mentor availability
        ↓
Mentor's local timezone
        ↓
Generate local slot
        ↓
Convert slot to UTC
        ↓
Compare against bookings
```

This is another reason not to treat timezone offsets as permanent values.

---

### 5. Booking timestamps

Bookings are different.

A booking represents a specific instant in time, so:

```text
startTimeUtc
endTimeUtc
```

are stored as UTC timestamps.

For example:

```text
2026-09-28T14:00:00Z
```

The frontend can then display that same instant as:

```text
Parent:
10:00 AM America/New_York

Mentor:
7:30 PM Asia/Kolkata
```

depending on the actual date and timezone rules.

---

### 6. Concurrency constraint

The following is particularly important:

```prisma
@@unique([mentorId, startTimeUtc])
```

This becomes a PostgreSQL unique constraint.

It guarantees that the database cannot contain:

```text
Mentor A + 14:00 UTC
Mentor A + 14:00 UTC
```

as two separate bookings.

This is not a replacement for the transaction/locking strategy; it is an additional protection layer.

---

### 7. Why `meetingLink` is unique

Each booking receives one dummy class URL.

Making it unique prevents accidental reuse of the same generated meeting link.

For example:

```text
https://demo.codeyoung.local/class/abc123
```

should belong to only one booking.

---

### 8. Indexing

The most important booking query will be approximately:

> Find bookings for this mentor around this time.

Therefore:

```prisma
@@index([mentorId, startTimeUtc])
```

is useful.

We also need:

```prisma
@@index([parentId])
```

for retrieving a parent's bookings.

And:

```prisma
@@index([mentorId, dayOfWeek])
```

on availability for quickly finding the relevant weekly schedule.

---

### 9. One important limitation

The unique constraint:

```text
mentorId + startTimeUtc
```

prevents duplicate bookings at the same start time.

It does **not**, by itself, prevent arbitrary overlapping appointments.

For this project, that is acceptable because we are explicitly defining:

```text
Trial class = 60 minutes
Fixed hourly slots
```

Therefore all valid bookings align to predefined one-hour boundaries.

If the requirements later changed to allow arbitrary durations, we would need a stronger PostgreSQL design, such as a time-range exclusion constraint.

We should document this assumption.

---

### 10. Database migration

After creating the schema, Prisma should generate the first migration.

The process will be:

```text
Prisma schema
      ↓
prisma migrate dev
      ↓
PostgreSQL migration
      ↓
Generated Prisma Client
```

The migration itself should be committed to Git.

This is important because an evaluator should be able to recreate the database without manually creating tables.

---

### 11. Seed data

We should create exactly 10 initial mentors.

For example:

```text
Mentor 01
Mentor 02
Mentor 03
Mentor 04
Mentor 05
Mentor 06
Mentor 07
Mentor 08
Mentor 09
Mentor 10
```

Each mentor will initially have:

```text
Timezone: Asia/Kolkata
Monday–Saturday: 09:00–21:00
Sunday: unavailable
```

We can use realistic names later for a better demo experience.

The seed script should be **idempotent**, meaning running it more than once should not create duplicate mentors.

---

### 12. Seed availability

For each mentor:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
```

we create:

```text
09:00–21:00
```

availability.

We don't need to create individual slot records.

The availability service will later derive:

```text
09:00–10:00
10:00–11:00
...
20:00–21:00
```

when needed.

---

### 13. Database lifecycle

The local development workflow should eventually be:

```text
docker compose up -d
        ↓
Prisma migration
        ↓
Prisma generate
        ↓
Prisma seed
        ↓
Start backend
        ↓
Start frontend
```

This should eventually be documented in `README.md` so another developer can reproduce the environment.

---

### 14. Validation belongs outside Prisma

The database schema defines structural constraints, but API input still needs application-level validation.

For example, the backend should validate:

```text
Name is not empty
Email has valid format
Timezone is valid
Date/time is valid
Requested appointment is in the future
```

We can use Zod for this.

The architecture becomes:

```text
HTTP request
     ↓
Zod validation
     ↓
Booking service
     ↓
Prisma transaction
     ↓
PostgreSQL constraints
```

This keeps validation responsibilities clear.

---

### 15. Next implementation milestone

Once the schema and migration are working, the next major component should be the **availability engine**.

It will take:

```text
requested date
+
parent timezone
+
mentor availability
+
existing bookings
```

and return slots such as:

```json
{
  "start": "2026-09-28T10:00:00-04:00",
  "end": "2026-09-28T11:00:00-04:00",
  "available": true
}
```

The critical part is that these displayed times are generated using timezone rules rather than hard-coded offsets.


# Session 4 — Availability Engine Design
## User Prompt
## AI Response
## AI Response

The next component should be the **availability engine**. This is the bridge between the mentor schedules stored in the database and the slots the parent sees in their own timezone.

The important principle is:

> **Availability is calculated from mentor schedules and existing bookings. It is not stored as a permanent list of slots.**

---

### 1. Availability request

The frontend can request availability with:

```http
GET /api/availability?date=2026-09-28&timezone=America/New_York
```

The two important inputs are:

```text
date
timezone
```

The date is interpreted as a **local date in the parent's timezone**.

We should not interpret:

```text
2026-09-28
```

as UTC midnight.

Instead:

```text
2026-09-28
+
America/New_York
```

means:

> September 28, 2026 according to the parent's local calendar.

---

### 2. Availability calculation

The process is:

```text
Parent date + timezone
          ↓
Determine parent's local day
          ↓
Generate possible local time slots
          ↓
Convert each slot to UTC
          ↓
Check mentors
          ↓
Check mentor availability
          ↓
Check existing bookings
          ↓
Check daily capacity
          ↓
Return available slots
```

However, there is an important architectural decision here.

The parent should not be shown a slot merely because **one mentor theoretically works during that time**.

The backend needs to determine whether at least one mentor can actually accept that appointment.

---

### 3. Mentor-local availability

Mentor schedules are defined in their own timezone.

For our initial system:

```text
Mentor timezone:
Asia/Kolkata

Working hours:
09:00–21:00
Monday–Saturday
```

Suppose the parent is in New York.

The system should:

1. Generate the parent's requested local day.
2. Determine possible appointment instants.
3. Convert those instants to UTC.
4. For each mentor, convert the UTC instant into the mentor's timezone.
5. Check whether that local time falls within the mentor's working schedule.

This is much safer than trying to manually calculate:

```text
India = New York + 9.5 hours
```

because the US offset changes with DST.

---

### 4. Example

Suppose the parent is in:

```text
America/New_York
```

and sees:

```text
September 28
10:00 AM
```

The system resolves that local time into an absolute UTC instant.

Then for an Indian mentor:

```text
Asia/Kolkata
```

the same instant might be displayed as:

```text
September 28
7:30 PM
```

The mentor is available if:

```text
7:30 PM
```

falls within their working hours.

The parent should only see:

```text
10:00 AM
```

because the booking UI is in the parent's timezone.

---

### 5. Fixed one-hour slots

For the MVP, slots should be one hour.

If the mentor's schedule is:

```text
09:00–21:00
```

the possible slots are:

```text
09:00–10:00
10:00–11:00
11:00–12:00
12:00–13:00
13:00–14:00
14:00–15:00
15:00–16:00
16:00–17:00
17:00–18:00
18:00–19:00
19:00–20:00
20:00–21:00
```

This gives us deterministic appointment boundaries.

---

### 6. DST handling

This is where the implementation needs to be careful.

We should use an IANA timezone-aware library such as Luxon.

The application should never do:

```javascript
// Don't do this
const mentorTime = parentTime + 9.5;
```

Instead:

```text
local datetime
      +
IANA timezone
      ↓
absolute instant
      ↓
another IANA timezone
```

The library determines the correct UTC offset for that date.

---

### 7. DST spring-forward edge case

During a spring-forward transition, some local times do not exist.

For example, a timezone might transition from:

```text
01:59
```

directly to:

```text
03:00
```

Therefore:

```text
02:30
```

does not represent a valid local instant on that date.

The availability engine should never silently create an appointment for a nonexistent local time.

For this assignment, using fixed one-hour slots and generating them through the timezone-aware library significantly reduces the risk.

DST transition dates should still be explicitly tested.

---

### 8. DST fall-back edge case

During the fall-back transition, an hour can occur twice.

For example:

```text
01:30
```

may occur once before the offset changes and once after.

This demonstrates why storing only:

```text
date + local time
```

is insufficient.

The canonical booking representation is:

```text
UTC instant
```

and the booking should retain the relevant timezone information for display.

---

### 9. Existing bookings

After generating a potential appointment instant, the backend checks existing bookings.

For a mentor:

```text
requested start UTC
requested end UTC
```

we determine whether the mentor already has a confirmed booking occupying that slot.

Because all classes are fixed at one hour and aligned to our slot boundaries, the conflict check is straightforward.

Cancelled bookings should not block availability.

---

### 10. Daily capacity

The engine must also check:

```text
confirmed bookings
for mentor
on mentor's local calendar day
```

If:

```text
count >= 2
```

that mentor cannot accept another class that day.

This is based on the mentor's local date, not the UTC date.

---

### 11. Returning slots

The API shouldn't expose unnecessary internal information.

The parent doesn't need:

```text
Mentor 4
Mentor ID 8394
Database UUID
```

They need:

```text
10:00 AM – 11:00 AM
Available
```

A response could conceptually look like:

```json
{
  "date": "2026-09-28",
  "timezone": "America/New_York",
  "slots": [
    {
      "start": "2026-09-28T10:00:00-04:00",
      "end": "2026-09-28T11:00:00-04:00",
      "available": true
    },
    {
      "start": "2026-09-28T11:00:00-04:00",
      "end": "2026-09-28T12:00:00-04:00",
      "available": true
    }
  ]
}
```

The frontend can format these values for display.

---

### 12. Availability should not guarantee booking

This distinction is extremely important.

The availability API provides:

> **What appears available right now.**

It does **not** reserve anything.

Therefore:

```text
Parent requests availability
        ↓
Slot shown
        ↓
Another parent books it
        ↓
First parent clicks Book
        ↓
Booking service re-checks everything
```

The booking service is authoritative.

This prevents a classic time-of-check/time-of-use race condition.

---

### 13. Better API semantics

I would use:

```http
GET /api/availability
```

for discovery.

Then:

```http
POST /api/bookings
```

for the actual reservation.

The POST endpoint must independently validate:

* Slot is in the future
* Timezone is valid
* Slot is valid
* Mentor is available
* Mentor hasn't reached two classes
* Mentor isn't already booked
* Request hasn't become stale

---

### 14. Performance considerations

With only:

```text
10 mentors
×
20 potential classes/day
```

we have an extremely small dataset.

We do **not** need Redis caching or complicated distributed availability infrastructure.

A simple PostgreSQL query plus application logic will be more than sufficient.

This is another example of good scope:

> Optimize for correctness and maintainability, not theoretical scale that the assignment doesn't require.

---

### 15. Availability service responsibility

I would isolate this logic into something like:

```text
AvailabilityService
```

Its conceptual responsibility is:

```text
getAvailableSlots(
    date,
    parentTimezone
)
```

It should return domain-level availability data.

The controller should only handle HTTP concerns:

```text
HTTP request
     ↓
validate query
     ↓
AvailabilityService
     ↓
HTTP response
```

This makes the core availability logic testable without running the entire React application.

---

### 16. Important testing cases

The availability engine should eventually have tests for:

### Normal timezone conversion

```text
India → US
US → India
UK → India
```

### DST

Dates before and after DST transitions.

### Mentor working hours

```text
08:00 → unavailable
09:00 → potentially available
20:00 → potentially available
21:00 → unavailable
```

### Existing booking

A booked slot should disappear from availability.

### Daily limit

A mentor with two confirmed bookings should not contribute additional capacity.

### Cancellation

A cancelled booking should free the capacity.

### Different local calendar dates

UTC date and mentor local date should not be assumed to be identical.

---

### 17. One architectural refinement

There is an important difference between:

```text
"Is this slot available?"
```

and:

```text
"Which mentor will be assigned?"
```

The availability endpoint only needs to answer the first question.

The booking service answers the second.

So:

```text
AvailabilityService
    ↓
Does at least one mentor qualify?

BookingService
    ↓
Which specific mentor should be assigned?
```

This separation prevents us from exposing internal mentor assignment unnecessarily and keeps the booking operation authoritative.

---

### 18. Final availability architecture

```text
                  Parent
                    │
                    ▼
           Select date/timezone
                    │
                    ▼
          GET /api/availability
                    │
                    ▼
             AvailabilityService
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
       Mentor    Existing   Capacity
       schedule  bookings   limits
          │         │         │
          └─────────┼─────────┘
                    ▼
              Available slots
                    │
                    ▼
              React displays
                    │
                    ▼
              Parent selects
                    │
                    ▼
           POST /api/bookings
                    │
                    ▼
             BookingService
                    │
                    ▼
        Authoritative re-check
                    │
                    ▼
           Transaction + lock
                    │
                    ▼
                Booking
```


# Session 5 — Booking Service and Concurrency Strategy

## User Prompt
## AI Response
The availability engine only tells the parent what appears to be available. The next component is the **booking service**, which is the authoritative part of the system.

The critical rule is:

> **A slot being available in the UI does not guarantee that it will still be available when the parent submits the booking.**

The booking service must re-check everything inside a transaction.

---

### 1. Booking request

The frontend should send something conceptually like:

```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "timezone": "America/New_York",
  "startTime": "2026-09-28T10:00:00-04:00"
}
```

The backend should not trust this blindly.

It must validate:

* Name
* Email
* IANA timezone
* Date/time format
* Appointment is in the future
* Requested slot is valid
* Requested slot aligns with our one-hour slot model

---

### 2. Convert local time to UTC

The requested time is interpreted according to the supplied IANA timezone.

Conceptually:

```text
Parent local time
2026-09-28 10:00
        +
America/New_York
        ↓
UTC instant
```

That UTC instant becomes the canonical value stored in PostgreSQL.

The backend should never manually calculate the offset.

---

### 3. Start a transaction

The critical booking logic happens inside a PostgreSQL transaction.

Conceptually:

```text
BEGIN
   ↓
Find candidate mentors
   ↓
Lock candidate mentor
   ↓
Re-check availability
   ↓
Re-check daily capacity
   ↓
Create booking
   ↓
COMMIT
```

If any required condition fails:

```text
ROLLBACK
```

---

### 4. Mentor selection

For the requested instant, the service determines which mentors:

1. Are active
2. Work during that local time
3. Have fewer than two confirmed classes that day
4. Do not already have a conflicting booking

Suppose the result is:

```text
Mentor 1 → available
Mentor 2 → available
Mentor 3 → 2 classes
Mentor 4 → available
```

The service can choose among Mentors 1, 2, and 4.

---

### 5. Assignment policy

A reasonable policy is **least-loaded mentor first**.

For example:

```text
Mentor 1 → 0 classes
Mentor 2 → 1 class
Mentor 4 → 0 classes
```

Mentors 1 and 4 are equally loaded, so we can use a deterministic tie-breaker such as mentor ID.

The purpose is to distribute bookings instead of filling one mentor first.

This isn't "ranking" mentors; it is simply an operational allocation rule.

---

### 6. Locking the mentor

Once a candidate mentor is selected, the booking transaction should lock the mentor row.

Conceptually:

```sql
SELECT *
FROM mentors
WHERE id = $mentorId
FOR UPDATE;
```

This is important because another concurrent transaction trying to modify/lock the same mentor will have to wait.

After acquiring the lock, the service performs the capacity check again.

---

### 7. Why the second availability check matters

Suppose:

```text
Mentor 1 has 1 class.
```

Two parents simultaneously request the same slot.

Without proper locking:

```text
Transaction A → sees 1
Transaction B → sees 1

A → creates second class
B → creates second class
```

The mentor ends up with three classes.

With the lock:

```text
Transaction A
    ↓
Lock Mentor 1
    ↓
See 1 class
    ↓
Create second class
    ↓
Commit
```

Then:

```text
Transaction B
    ↓
Waits for Mentor 1
    ↓
Lock acquired
    ↓
Now sees 2 classes
    ↓
Rejects Mentor 1
```

This is the concurrency property we want.

---

### 8. Database constraint remains the final protection

We should still have:

```text
id="0cxm4e"
UNIQUE(mentor_id, start_time_utc)
```

If some unexpected race or programming mistake reaches the insert, PostgreSQL still refuses the duplicate.

The application should catch that constraint violation.

It can then:

1. Try another mentor, if appropriate.
2. Otherwise return a conflict response.

For example:

```http
409 Conflict
```

with:

```json
{
  "code": "SLOT_NO_LONGER_AVAILABLE",
  "message": "This slot was just booked. Please select another time."
}
```

---

### 9. Capacity calculation

The daily capacity must use the mentor's local calendar day.

For example:

```text
UTC:
2026-09-28 00:30

Mentor:
Asia/Kolkata

Local:
2026-09-28 06:00
```

The relevant day is:

```text
2026-09-28
```

according to the mentor's timezone.

The service should count:

```text
CONFIRMED bookings
```

for that mentor on that local date.

Cancelled bookings should not consume capacity.

---

### 10. Booking creation

Once all checks pass:

```text
id="7pxhpm"
Booking
-------
parent_id
mentor_id
start_time_utc
end_time_utc
parent_timezone
status = CONFIRMED
meeting_link
```

The meeting link can be generated using a random UUID.

For example:

```text
https://demo.codeyoung.local/class/<booking-id>
```

There is no need to integrate a real video provider.

---

### 11. Transaction boundary

The transaction should cover the critical section:

```text
id="z6iq3m"
BEGIN
  │
  ├── Find candidate
  │
  ├── Lock mentor
  │
  ├── Check daily capacity
  │
  ├── Check slot conflict
  │
  ├── Generate meeting link
  │
  ├── Create booking
  │
  └── COMMIT
```

The system should not commit the booking first and then perform critical validation afterward.

---

### 12. What if the selected mentor becomes unavailable?

The system should not immediately fail if another mentor can handle the booking.

For example:

```text
Requested slot
      │
      ├── Mentor 1 → conflict
      ├── Mentor 2 → available
      └── Mentor 3 → available
```

The booking service can attempt Mentor 2.

Only when no valid mentor remains should it return:

```text
409 Conflict
```

with a useful message.

---

### 13. Idempotency / duplicate submissions

There is another practical issue:

A parent clicks:

```text
Book Trial Class
```

and the request succeeds.

Then their browser sends the request again because of a retry or accidental double click.

We shouldn't create two bookings unnecessarily.

For a small take-home system, we can handle this by disabling the submit button immediately on the frontend and also implementing a backend-level duplicate protection strategy.

A stronger production implementation could accept an idempotency key:

```http
Idempotency-Key: <unique-request-id>
```

and store it with the booking request.

Whether to implement full idempotency-key storage depends on time. It is a useful future enhancement, but the core booking concurrency requirements should come first.

---

### 14. Error classification

The API should distinguish expected business conflicts from server failures.

For example:

### 400 Bad Request

Invalid input:

```text
Invalid timezone
Invalid email
Malformed date
```

### 409 Conflict

Business conflict:

```text
Slot just became unavailable
No mentor available
Mentor capacity reached
```

### 500 Internal Server Error

Unexpected infrastructure/application failure.

The frontend should never display a raw stack trace.

---

### 15. Booking response

A successful response can contain:

```json
{
  "id": "booking-id",
  "status": "CONFIRMED",
  "mentor": {
    "name": "Ananya Sharma",
    "timezone": "Asia/Kolkata"
  },
  "parent": {
    "timezone": "America/New_York"
  },
  "startTimeUtc": "2026-09-28T14:00:00Z",
  "endTimeUtc": "2026-09-28T15:00:00Z",
  "meetingLink": "https://demo.codeyoung.local/class/booking-id"
}
```

The frontend can convert the UTC timestamps into the appropriate display time.

---

### 16. Keep notification logic separate

We don't need to actually send email.

But the architecture can contain a simple notification abstraction:

```text
BookingService
      ↓
NotificationService
      ↓
Development Email Adapter
```

The development adapter can simply log:

```text
EMAIL SIMULATION

To: parent@example.com
Subject: Trial Class Confirmation

Mentor: Ananya Sharma
Time: ...
Join: ...
```

This demonstrates how real email delivery could be added without coupling the booking service directly to an email provider.

---

### 17. Booking service responsibilities

The booking service should therefore own:

```text
id="z5g7m0"
Input validation coordination
Timezone conversion
Slot validation
Mentor candidate selection
Concurrency handling
Daily capacity
Booking creation
Meeting-link generation
Notification triggering
```

The controller should not contain this logic.

The controller should remain thin:

```text
HTTP request
    ↓
Validate request
    ↓
BookingService
    ↓
HTTP response
```

---

### 18. Final booking architecture

```text
                 POST /api/bookings
                         │
                         ▼
                Request validation
                         │
                         ▼
                 BookingService
                         │
                  Convert to UTC
                         │
                         ▼
                Find candidates
                         │
                         ▼
                BEGIN TRANSACTION
                         │
                         ▼
                Lock mentor row
                         │
                         ▼
              Re-check capacity
                         │
                         ▼
             Re-check slot conflict
                         │
                  ┌──────┴──────┐
                  │             │
                valid         conflict
                  │             │
                  ▼             ▼
             Create booking   Try another
                  │             │
                  ▼             │
                COMMIT ◄────────┘
                  │
                  ▼
          Notification service
                  │
                  ▼
              API response
```

This gives us a small but genuinely production-minded booking system.

# Session 6 — Backend Implementation

## AI Response
The next implementation stage is to build the backend foundation and the availability engine before implementing the booking transaction itself.

1. Backend implementation order

I would implement the backend in this order:

Prisma client and database connection
Database migration
Seed data
Repository layer
Zod request validation
Timezone utilities
Availability service
Availability controller and route
Centralized error handling
Automated tests

This order keeps the dependencies clear and allows the availability logic to be tested independently before adding booking concurrency.

2. Prisma client

Create a single Prisma client instance for the application rather than creating a new database connection for every request.

The Prisma client should live in the infrastructure/configuration layer and be imported by repositories.

The application should not allow controllers to access Prisma directly.

The intended dependency direction is:

Route
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Prisma
  ↓
PostgreSQL

This keeps business rules out of HTTP handlers and makes the services easier to test.

3. Database migration and seed data

After finalizing the Prisma schema, create the initial migration and apply it to PostgreSQL.

The seed script should create:

10 active mentors
mentor names and unique email addresses
Asia/Kolkata as the initial mentor timezone
Monday–Saturday availability
working hours from 09:00 to 21:00 IST
Sunday with no availability

The seed data should be deterministic so that the project can be reset and reproduced easily.

The README should eventually include a simple setup flow such as:

Install dependencies
↓
Start PostgreSQL
↓
Configure .env
↓
Run migration
↓
Run seed
↓
Start backend
↓
Start frontend
4. Repository layer

Repositories should provide database-specific operations without containing business decisions.

For example:

MentorRepository
- findActiveMentors()
- findAvailableMentors()
- findById()

AvailabilityRepository
- findForMentorAndDay()

BookingRepository
- findBookingsForPeriod()
- countBookingsForMentorDay()
- findBookingByMentorAndStart()
- createBooking()

The repositories should answer questions about database state.

The services should decide what that state means from a business perspective.

5. Timezone utility

Timezone handling is one of the most important parts of this assignment.

The application should use IANA timezone identifiers such as:

America/New_York
Europe/London
Asia/Kolkata

The frontend sends the parent's selected timezone and local date/time.

The backend then interprets that local time using the supplied IANA timezone and converts it into UTC.

Luxon will be used for these conversions because it provides explicit timezone support and makes DST handling easier to reason about.

The application must never perform timezone conversion using manually calculated offsets such as:

IST = UTC + 5:30
EST = UTC - 5

That would break when daylight-saving rules change.

6. Availability algorithm

The availability endpoint will accept:

GET /api/availability?date=YYYY-MM-DD&timezone=<IANA timezone>

The date represents the parent's local calendar date.

For example:

date = 2026-09-28
timezone = America/New_York

The backend should:

Validate the date.
Validate the IANA timezone.
Generate the parent's requested local date.
Determine the corresponding period in UTC.
Load active mentors.
Read each mentor's recurring local availability.
Generate one-hour candidate slots.
Convert each candidate slot into UTC.
Check whether the mentor already has a conflicting booking.
Check the mentor's local daily booking count.
Mark the slot available if at least one mentor can accept it.
Return the available slots in the parent's timezone.

Importantly, the availability endpoint should not assign or reserve a mentor.

It is only an availability projection.

The actual booking request must repeat the relevant checks because the state may change between the availability request and the booking request.

7. Example API response

A simple response could be:

{
  "date": "2026-09-28",
  "timezone": "America/New_York",
  "slots": [
    {
      "start": "2026-09-28T10:00:00-04:00",
      "end": "2026-09-28T11:00:00-04:00"
    },
    {
      "start": "2026-09-28T11:00:00-04:00",
      "end": "2026-09-28T12:00:00-04:00"
    }
  ]
}

The frontend can directly display these values in the parent's local timezone.

8. Important DST handling

The availability engine must not assume that every local hour exists.

During a DST spring-forward transition, a local time can be nonexistent.

During a DST fall-back transition, a local time can occur twice.

The timezone library should therefore be responsible for resolving these cases rather than the application manually manipulating offsets.

For this assignment, invalid/nonexistent local times should not be offered as selectable slots.

If an ambiguous time occurs, the system should use an explicit and documented policy rather than silently producing inconsistent UTC timestamps.

9. Daily capacity calculation

The mentor's maximum of two classes per day must be calculated using the mentor's local calendar date.

This distinction is important.

For example, a booking may have a UTC date of September 29 while still occurring on September 28 according to the mentor's local timezone.

Therefore, capacity cannot simply be calculated using:

DATE(start_time_utc)

Instead, the booking's UTC timestamp must be converted to the mentor's timezone before determining the mentor's local calendar day.

10. Error handling

The backend should have centralized error handling.

Expected errors should be converted into consistent API responses.

For example:

400 Bad Request
Invalid timezone or malformed date
409 Conflict
No mentor is available for the requested slot
500 Internal Server Error
Unexpected database or application failure

The frontend should not need to understand database errors directly.

It should receive predictable API-level errors.

11. Testing the availability engine

Before implementing booking creation, the availability logic should be tested with cases such as:

normal weekday
Sunday with no mentor availability
fully booked mentor
mentor with one remaining daily slot
all mentors fully booked
parent in India timezone
parent in US timezone
parent in UK timezone
timezone crossing midnight
DST transition
past date
malformed timezone
invalid date

These tests are particularly important because timezone bugs can appear correct during ordinary dates while failing around DST boundaries.

12. What should not be added yet

At this stage, I would deliberately avoid:

Redis
caching
message queues
WebSockets
microservices
Kubernetes
external calendar APIs
authentication systems
real email providers

The expected scale is small, and these technologies would increase complexity without solving an actual requirement.

The goal is to demonstrate sound backend engineering rather than infrastructure complexity.

13. Next stage

Once the availability endpoint is working and tested, the next major step is the booking endpoint.

That endpoint will introduce the most important transactional logic:

Validate request
      ↓
Convert local time → UTC
      ↓
BEGIN TRANSACTION
      ↓
Find eligible mentors
      ↓
Lock mentor row
      ↓
Re-check daily capacity
      ↓
Re-check slot conflict
      ↓
Create booking
      ↓
Generate meeting link
      ↓
COMMIT
      ↓
Return confirmation

This is where the previously identified concurrency problem will be handled explicitly rather than relying only on the availability endpoint.

# Session 7 — Booking Endpoint and Transactional Concurrency
## AI Response

The next stage is to implement the booking workflow. This is the most important backend part of the assignment because availability is only an estimate; the booking operation must be authoritative and safe when multiple parents attempt to book at the same time.

### 1. Booking API

The primary endpoint should be:

```text
POST /api/bookings
```

The request should contain the parent's information and the selected local slot.

For example:

```json
{
  "parent": {
    "name": "John Doe",
    "email": "john@example.com",
    "timezone": "America/New_York"
  },
  "start": "2026-09-28T10:00:00",
  "timezone": "America/New_York"
}
```

The backend should not trust the frontend's claim that the slot is available.

It must validate the request and independently verify availability.

### 2. Validation

Use Zod to validate:

* parent name
* email format
* IANA timezone
* local date/time format
* required fields
* future appointment requirement

Invalid input should immediately return:

```text
400 Bad Request
```

The API should reject malformed or unsupported timezone identifiers rather than allowing them to reach the database layer.

### 3. Local time to UTC conversion

The submitted local datetime should be interpreted using the parent's supplied IANA timezone.

For example:

```text
Parent timezone:
America/New_York

Parent selects:
2026-09-28 10:00

↓

Convert using timezone rules

↓

Store:
UTC instant
```

The database stores the UTC instant as the canonical appointment time.

The original parent timezone is also stored in `Booking.parentTimezone`.

This is important because the timezone used when the booking was created should remain available for historical confirmation and display purposes.

### 4. Finding eligible mentors

The booking service should determine which mentors can accept the requested appointment.

A mentor is eligible only if:

1. The mentor is active.
2. The requested time falls within their working hours.
3. They do not already have a conflicting booking.
4. They have fewer than two confirmed classes on that mentor's local calendar day.

The system should evaluate these conditions using the mentor's own timezone.

### 5. Mentor assignment

If multiple mentors are available, the system needs a deterministic assignment policy.

For example:

```text
Choose the available mentor
with the lowest number of confirmed bookings
for that local day.
```

If there is still a tie, use a deterministic secondary key such as mentor ID.

This distributes classes reasonably while keeping the implementation simple.

The system does not need an AI matching algorithm because the assignment requirements do not justify that complexity.

### 6. The concurrency problem

A critical issue occurs if two parents attempt to book the same remaining mentor capacity simultaneously.

Consider:

```text
Mentor A currently has:
1 booking
```

Two requests arrive at nearly the same time.

Without proper concurrency protection:

```text
Request A → sees 1 booking → available
Request B → sees 1 booking → available

Request A → creates booking
Request B → creates booking
```

The mentor could end up with three classes even though the maximum is two.

Similarly, two requests could both see the same slot as free and attempt to assign the same mentor.

Therefore, checking availability outside the transaction is insufficient.

### 7. Transaction strategy

The booking operation should use a PostgreSQL transaction.

The important sequence is:

```text
BEGIN
   ↓
Find eligible mentor
   ↓
Lock mentor row
   ↓
Re-check bookings/capacity
   ↓
Re-check requested slot
   ↓
Create booking
   ↓
COMMIT
```

The row-level lock ensures that competing booking transactions cannot simultaneously make conflicting capacity decisions for the same mentor.

The checks performed before acquiring the lock are only candidate selection.

The checks after acquiring the lock are authoritative.

### 8. Database constraint

The database should also enforce:

```text
UNIQUE(mentor_id, start_time_utc)
```

This gives the database a final safeguard against two bookings being created for the same mentor and start time.

Application-level checks are useful, but important invariants should also be enforced at the database level.

This is an example of defense in depth:

```text
Application validation
        +
Transaction/row lock
        +
Database constraint
```

### 9. Conflict handling

A race can still occur between different candidates or because of an unexpected database conflict.

If the database rejects an insert because of the unique constraint, the service should handle that error rather than exposing a raw database exception.

The API should return a meaningful conflict response such as:

```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The selected time is no longer available. Please choose another slot."
  }
}
```

The frontend can then refresh availability and ask the parent to select another time.

### 10. Meeting link generation

No real video-conferencing integration is required.

A deterministic application-generated dummy link is sufficient for the assignment.

For example:

```text
https://example.com/trial/<booking-id>
```

The link should be generated only after the booking has been successfully validated.

The actual production implementation could later replace this with Zoom, Google Meet, or another provider without changing the core booking model.

### 11. Notification simulation

The assignment requires that the parent and mentor receive a dummy link.

A real email provider is unnecessary for the MVP.

After a successful booking, the backend can simulate the notification by:

* returning the confirmation information through the API
* logging the notification event
* optionally exposing the confirmation in the UI

For example:

```text
Parent notification:
Trial class confirmed
Date/time: 10:00 AM America/New_York
Mentor: Mentor 3
Link: https://example.com/trial/...

Mentor notification:
New trial class assigned
Date/time: 7:30 PM Asia/Kolkata
Parent: John Doe
Link: https://example.com/trial/...
```

The important requirement is that both local time representations are correct.

### 12. Booking response

A successful response should contain enough information for the confirmation page.

For example:

```json
{
  "id": "booking-id",
  "status": "CONFIRMED",
  "parent": {
    "name": "John Doe",
    "timezone": "America/New_York",
    "start": "2026-09-28T10:00:00-04:00",
    "end": "2026-09-28T11:00:00-04:00"
  },
  "mentor": {
    "name": "Mentor 3",
    "timezone": "Asia/Kolkata",
    "start": "2026-09-28T19:30:00+05:30",
    "end": "2026-09-28T20:30:00+05:30"
  },
  "meetingLink": "https://example.com/trial/booking-id"
}
```

This makes the timezone handling visible and easy to verify during the demo.

### 13. Cancellation

A simple cancellation endpoint can be implemented after the core booking flow:

```text
POST /api/bookings/:id/cancel
```

Cancellation should change:

```text
CONFIRMED → CANCELLED
```

rather than deleting the booking.

This preserves historical information and allows the mentor's capacity to become available again.

The daily capacity calculation should count only confirmed bookings.

### 14. Testing strategy

The booking service should have tests for:

* successful booking
* invalid email
* invalid timezone
* booking in the past
* booking outside mentor availability
* no available mentor
* mentor already at two classes
* same mentor/same slot conflict
* cancellation
* concurrent booking attempts
* timezone conversion
* DST-related booking
* database constraint conflict

The concurrency test is particularly valuable because it demonstrates that the implementation handles the difficult part of the assignment rather than merely implementing the happy path.

### 15. Resulting backend flow

The completed backend architecture should now look like:

```text
HTTP Request
     ↓
Route
     ↓
Zod Validation
     ↓
Controller
     ↓
Booking Service
     ↓
Timezone Conversion
     ↓
Database Transaction
     ↓
Mentor Repository
     ↓
Booking Repository
     ↓
PostgreSQL
     ↓
Booking Confirmation
```

# Session 8 — Frontend Booking Experience
## AI Response

The backend now defines the core booking rules, so the next stage is to build the React frontend around the actual customer journey.

The frontend should prioritize clarity and usability rather than trying to demonstrate every possible feature.

### 1. Parent booking flow

The parent experience should be a simple sequence:

```text
Choose timezone
      ↓
Choose date
      ↓
View available slots
      ↓
Select a slot
      ↓
Enter name + email
      ↓
Confirm booking
      ↓
View confirmation
```

The user should always know:

* which timezone is being used
* which date they selected
* what local time the class will occur
* whether the slot is still available
* what happens after clicking the booking button

### 2. Frontend structure

The React application can be organized around feature-level components rather than putting everything into one large component.

For example:

```text
src/
├── components/
│   ├── DatePicker.tsx
│   ├── TimezoneSelector.tsx
│   ├── SlotGrid.tsx
│   ├── BookingForm.tsx
│   ├── BookingSummary.tsx
│   └── LoadingState.tsx
│
├── pages/
│   ├── BookingPage.tsx
│   ├── ConfirmationPage.tsx
│   └── MentorDashboardPage.tsx
│
├── services/
│   └── api.ts
│
├── types/
│   └── booking.ts
│
└── utils/
    └── timezone.ts
```

The exact folder structure can remain small if some files are not necessary. The goal is separation of responsibilities, not creating files simply to increase the architecture.

### 3. Timezone selection

The parent should be able to select their timezone explicitly.

The browser's detected timezone can be used as the default, but it should not be treated as infallible.

For example, the application can initially detect:

```text
Intl.DateTimeFormat().resolvedOptions().timeZone
```

and then allow the parent to change it.

This is important because the assignment explicitly requires support for parents and mentors being in different timezones.

### 4. Date selection

The date picker should prevent obviously invalid selections such as dates in the past.

The frontend should send the selected calendar date separately from the timezone.

For example:

```text
date:
2026-09-28

timezone:
America/New_York
```

The frontend should not convert the selected calendar date into UTC before requesting availability.

A calendar date is not itself an instant in time.

### 5. Displaying available slots

Once the parent selects a date, the frontend calls:

```text
GET /api/availability
```

The response provides available slots in the parent's timezone.

The UI can display them as simple selectable buttons:

```text
10:00 AM
11:00 AM
12:00 PM
1:00 PM
```

Selected and unavailable states should be visually distinct.

The interface should also clearly show when:

* slots are loading
* no slots are available
* the API fails
* the selected date has no availability

### 6. Avoid exposing unnecessary mentor details

The parent does not need to choose a mentor.

The system's responsibility is:

```text
Parent chooses time
        ↓
System assigns mentor
```

Therefore, the availability UI should show time slots rather than a list of mentors.

The assigned mentor can be revealed after booking.

This keeps the customer experience simple and prevents the frontend from accidentally turning mentor selection into a requirement.

### 7. Booking form

After selecting a time slot, display a small form:

```text
Name
Email
```

The timezone and selected time should remain visible so the parent can verify the information before submitting.

For example:

```text
Trial Class

Monday, September 28
10:00 AM – 11:00 AM
America/New_York

Name: [________________]
Email: [________________]

[ Confirm Trial Class ]
```

The form should validate basic requirements before making the API request.

### 8. Preventing duplicate submissions

When the parent clicks the confirmation button:

```text
Confirm Trial Class
        ↓
button disabled
        ↓
request sent
        ↓
response received
```

The button should not remain active while the request is being processed.

This prevents accidental double clicks from generating multiple requests.

This is only a UX safeguard. The backend remains responsible for enforcing booking correctness.

### 9. Handling a slot becoming unavailable

One important scenario is:

```text
Parent A opens availability
Parent B books the slot
Parent A clicks Confirm
```

The frontend must handle the backend's `409 Conflict`.

Instead of showing a technical error, display something understandable:

> This time slot was just booked by another parent. Please choose another available time.

The application can then refresh availability.

This demonstrates that the frontend understands the difference between an ordinary server failure and a business conflict.

### 10. Confirmation page

After successful booking, navigate to a confirmation page.

It should clearly display:

```text
Trial Class Confirmed

Parent:
John Doe

Your time:
10:00 AM – 11:00 AM
America/New_York

Mentor:
Mentor 3

Mentor's time:
7:30 PM – 8:30 PM
Asia/Kolkata

Live class:
[ Join Trial Class ]
```

The timezone difference should be visible rather than hidden.

This is particularly useful for demonstrating that the assignment's timezone requirement was actually implemented.

### 11. Mentor dashboard

A lightweight mentor view is enough for the assignment.

It does not need full authentication.

A simple route such as:

```text
/mentor/:mentorId
```

can display assigned classes.

For each booking:

```text
Parent
Date
Time in mentor timezone
Status
Meeting link
```

For example:

```text
Today's Classes

7:30 PM – 8:30 PM
Parent: John Doe
Status: Confirmed

[ Join Class ]
```

The important requirement is demonstrating that the same appointment can be represented correctly in the mentor's timezone.

### 12. Loading and error states

Every API-driven part of the application should have explicit states:

```text
Loading
Success
Empty
Error
```

For availability:

```text
Loading available times...
```

For no availability:

```text
No trial classes are available for this date.
Please choose another date.
```

For server failure:

```text
We couldn't load available times.
Please try again.
```

These states make the application feel substantially more complete than an interface that only handles successful responses.

### 13. Responsive design

The interface should work on:

* desktop
* tablet
* mobile

The booking flow itself is simple enough that responsive support should not require significant additional complexity.

The most important consideration is making the date and time selection easy to use on a small screen.

### 14. Avoid overbuilding the UI

The frontend does not need:

* complex animations
* elaborate dashboards
* a design system with dozens of components
* real authentication
* payment screens
* chat
* notification settings
* an administrative CMS

A clean, consistent interface with good empty/loading/error states will demonstrate better product judgment than a visually complicated application with incomplete functionality.

### 15. Frontend-backend contract

The frontend should communicate with the backend through a small API client rather than placing raw `fetch()` calls throughout components.

For example:

```text
api.getAvailability(...)
api.createBooking(...)
api.getBooking(...)
api.getMentorBookings(...)
api.cancelBooking(...)
```

The API response types should be represented with TypeScript interfaces/types.

This provides one clear location for handling:

* API URLs
* HTTP methods
* JSON parsing
* API errors
* response typing

### 16. Final customer journey

The intended finished experience is:

```text
Parent opens application
        ↓
Timezone detected/selected
        ↓
Parent selects date
        ↓
Available local times appear
        ↓
Parent selects 10:00 AM
        ↓
Parent enters name/email
        ↓
Backend validates + assigns mentor
        ↓
Booking is created atomically
        ↓
Confirmation displayed
        ↓
Parent sees their local time
        ↓
Mentor sees their local time
        ↓
Both have the same dummy meeting link
```

# Session 9 — End-to-End Testing and Edge-Case Validation

Once the frontend and backend are connected, the next priority should be testing the complete system rather than immediately adding more features.

The assignment specifically evaluates whether the implementation handles real-world edge cases, especially around scheduling, timezones, mentor capacity, and concurrent bookings.

### 1. Testing strategy

Testing should happen at three levels:

```text
Unit Tests
   ↓
Integration/API Tests
   ↓
End-to-End Tests
```

Each level verifies a different type of correctness.

### 2. Unit tests

Unit tests should focus on deterministic business logic that can be tested without running the complete application.

Important candidates include:

* timezone conversion
* local date → UTC conversion
* UTC → mentor local time conversion
* mentor daily capacity calculation
* slot generation
* working-hour validation
* DST handling
* booking eligibility rules

For example:

```text
Parent:
America/New_York

Selected:
10:00 AM

↓

UTC instant

↓

Mentor:
Asia/Kolkata

↓

Correct mentor-local time
```

The exact displayed time should be verified rather than simply checking that the conversion function does not throw an error.

### 3. Availability API tests

Test the availability endpoint independently.

Important scenarios:

#### Normal weekday

A normal working day should return the expected hourly slots.

#### Sunday

Since mentors are unavailable on Sunday, the API should return no available slots.

#### Fully booked mentor

A mentor with two confirmed classes should not contribute any additional availability for that local day.

#### Multiple mentors

If one mentor is fully booked but another is available, the slot should remain available.

#### All mentors unavailable

The API should return an empty slot list rather than an application error.

### 4. Booking API tests

Test successful booking creation first:

```text
Valid parent
+
Valid timezone
+
Valid future slot
+
Available mentor

↓

201 Created
```

Then test invalid requests:

```text
Invalid email
Invalid timezone
Malformed datetime
Past appointment
Missing name
Missing email
```

These should return appropriate `400` responses.

### 5. Booking conflict tests

A particularly important test is booking the same mentor and slot twice.

The first request should succeed.

The second should receive a conflict response.

The database constraint should act as the final protection even if application-level availability checks incorrectly race.

### 6. Mentor capacity test

Test the two-class limit explicitly.

Example:

```text
Mentor A

Booking 1 → 10:00
Booking 2 → 14:00
```

A third booking on the same mentor's local calendar day should not be assigned to Mentor A.

If another mentor is available, the booking should be assigned to that mentor.

If every mentor has reached the daily limit, the request should return a meaningful conflict response.

### 7. Local-day capacity test

This test is particularly important.

Suppose the mentor is in:

```text
Asia/Kolkata
```

and a booking is represented internally using UTC.

The application must convert the booking to the mentor's timezone before determining which calendar day it belongs to.

The test should specifically use a UTC timestamp whose local date differs from the UTC date.

This verifies that the implementation did not accidentally use the UTC calendar date for daily capacity.

### 8. DST tests

Timezone handling should be tested around DST transitions.

At minimum, test:

* a normal date before DST
* a normal date after DST
* the spring-forward transition
* the fall-back transition

The purpose is to verify that the application does not assume a timezone has one permanent UTC offset.

For example, the system should not contain logic such as:

```text
New York = UTC - 5
```

because the actual offset depends on the date.

### 9. Frontend tests

The frontend should verify the main user states:

```text
Loading availability
Available slots
No available slots
API failure
Slot selected
Form validation failure
Booking in progress
Booking successful
Booking conflict
```

The important point is that errors should be understandable to the user.

A raw error such as:

```text
PrismaClientKnownRequestError
```

should never appear in the UI.

### 10. End-to-end happy path

The complete application should be tested from the user's perspective:

```text
Open booking page
        ↓
Select timezone
        ↓
Select date
        ↓
Select slot
        ↓
Enter name/email
        ↓
Confirm booking
        ↓
Booking succeeds
        ↓
Confirmation displayed
        ↓
Mentor dashboard shows booking
```

The same booking should be verified from both timezone perspectives.

### 11. Concurrency test

The most valuable backend test is a concurrent booking scenario.

Create two requests that attempt to consume the same mentor capacity simultaneously.

The expected invariant is:

```text
Mentor confirmed bookings <= 2
```

and:

```text
No mentor has two bookings
for the same fixed one-hour start time.
```

The exact winning request is not important.

What matters is that the system does not violate the business constraints.

This test demonstrates why the transaction, row-level locking, and database constraint were introduced.

### 12. API status code contract

The application should use consistent HTTP semantics:

| Situation                       | Response |
| ------------------------------- | -------: |
| Successful availability request |    `200` |
| Successful booking              |    `201` |
| Invalid request                 |    `400` |
| Booking/slot conflict           |    `409` |
| Booking not found               |    `404` |
| Unexpected server error         |    `500` |

The exact error response structure should also remain consistent across endpoints.

### 13. Manual acceptance checklist

Before considering the product complete, manually verify:

```text
[ ] Parent can select timezone
[ ] Parent can select future date
[ ] Available slots load
[ ] Slot displays in parent's local timezone
[ ] Parent can enter details
[ ] Booking succeeds
[ ] Mentor is automatically assigned
[ ] Mentor sees booking
[ ] Mentor sees correct local time
[ ] Parent sees correct local time
[ ] Dummy meeting link exists
[ ] Same meeting link appears for both sides
[ ] Fully booked mentor is not assigned
[ ] Third booking cannot exceed daily capacity
[ ] Already-booked slot cannot be double-booked
[ ] Cancellation works
[ ] Cancelled booking releases capacity
[ ] Invalid timezone is rejected
[ ] Past booking is rejected
[ ] No-availability state is understandable
[ ] Server errors are handled gracefully
```

### 14. Production-quality checks

Before final submission, also verify:

```text
[ ] No secrets committed
[ ] .env ignored
[ ] .env.example provided
[ ] TypeScript build succeeds
[ ] Backend tests pass
[ ] Frontend builds successfully
[ ] PostgreSQL starts from Docker Compose
[ ] Database migration works from a clean database
[ ] Seed script works
[ ] README instructions work from scratch
[ ] API health endpoint works
[ ] No unnecessary console/debug code
[ ] Error messages do not expose database internals
```

### 15. What to do if a test exposes a design problem

Do not immediately patch individual failures.

First determine whether the failure indicates a deeper architectural issue.

For example:

```text
DST test fails
```

should lead to reviewing timezone handling rather than adding another hard-coded offset.

Similarly:

```text
Concurrent booking test fails
```

should lead to reviewing transaction boundaries and database constraints rather than adding a frontend button delay.

This is important because the assignment evaluates engineering judgment, not merely whether the happy path works.

### 16. Definition of done

The core system can be considered functionally complete when:

```text
Parent
  ↓
Selects local date/time
  ↓
Backend converts timezone
  ↓
Available mentor is found
  ↓
Booking is created transactionally
  ↓
Capacity constraints remain valid
  ↓
Confirmation is returned
  ↓
Parent + mentor see correct local times
```

At that point, additional work should shift from adding features to improving reliability, documentation, UX, testing, and deployment readiness.
