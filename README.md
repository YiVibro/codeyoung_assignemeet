# CodeYoung Trial Class Booking System

A full-stack trial-class appointment booking system built for the CodeYoung Full-Stack Development Assignment.

The system allows parents to select a preferred date, local time range, and timezone. It finds available one-hour trial-class slots and assigns an available mentor while handling timezone conversion, daylight-saving-time edge cases, mentor daily capacity, overlapping bookings, and concurrent booking requests.

---

## 1. Problem Statement

CodeYoung has:

- 10 mentors
- Up to 2 trial classes per mentor per day
- Up to 20 trial classes per day
- Parents who may be located in different timezones
- Mentors who may also work in different timezones

A parent should be able to:

1. Select their timezone.
2. Select a future date.
3. Select a preferred local time range.
4. View available one-hour slots.
5. Select a slot.
6. Enter their details.
7. Confirm the booking.

The system then assigns an available mentor and generates a dummy live-class link.

Both the parent and mentor should see the class time in their own timezone.

---

# 2. Features

## Parent

- Select IANA timezone.
- Select a future date.
- Select a preferred local time range.
- View only available one-hour slots.
- Book a trial class.
- View assigned mentor.
- View class time in parent timezone.
- View class time in mentor timezone.
- Receive a dummy meeting link.
- Receive clear errors when no mentor is available.

## Mentor

- View assigned trial classes.
- View parent information.
- View class time in mentor's local timezone.
- View booking status.
- View dummy meeting link.

## Backend

- REST API using Express.
- PostgreSQL persistence.
- Prisma ORM.
- Transactional mentor assignment.
- Mentor daily capacity enforcement.
- Overlap detection.
- Cancellation support.
- Rebooking after cancellation.
- Timezone-aware scheduling.
- DST validation.
- Input validation using Zod.
- Centralized error handling.

---

# 3. Technology Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- Luxon
- CSS

## Backend

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Zod
- Luxon

## Testing

- Vitest
- Supertest

## Infrastructure

- Docker Compose
- PostgreSQL

---

# 4. Architecture

```text
┌─────────────────────────────┐
│        React Frontend       │
│                             │
│  Parent Booking             │
│  Confirmation               │
│  Mentor Dashboard           │
└──────────────┬──────────────┘
               │ REST / JSON
               ▼
┌─────────────────────────────┐
│      Express API Server     │
│                             │
│ Controllers                 │
│ Validation                  │
│ Error Handling              │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│          Services           │
│                             │
│ Availability Service        │
│ Booking Service             │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│       Repository Layer      │
│                             │
│ Parent Repository           │
│ Mentor Repository           │
│ Booking Repository          │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│         PostgreSQL          │
└─────────────────────────────┘

The application uses a layered backend design so that HTTP handling, business rules, and database operations remain separated.

5. Project Structure
codeyoung_assignment/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── scripts/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   └── tests/
│
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       ├── types/
│       └── utils/
│
├── docker-compose.yml
├── README.md
├── TRANSCRIPT.md
└── .gitignore
6. Timezone Design

Timezone handling is based on IANA timezone identifiers.

Examples:

America/New_York
Europe/London
Asia/Kolkata

The system does not store timezone offsets such as:

UTC-04:00
UTC+05:30

because offsets can change due to daylight saving time.

Instead:

Booking timestamps are stored in UTC.
Parent timezone is stored with the booking.
Mentor timezone is stored with the mentor.
Luxon is used for timezone conversion.
Display times are converted from UTC into the relevant local timezone.

Conceptually:

Parent local time
       │
       ▼
IANA timezone
       │
       ▼
      UTC
       │
       ▼
Mentor local time

This makes the UTC timestamp the canonical representation of the booking.

7. Daylight Saving Time

The system explicitly handles DST edge cases.

Nonexistent local time

During a spring-forward transition, some local times do not exist.

Example:

02:30

may disappear when clocks move from 02:00 to 03:00.

The backend rejects such a booking instead of silently changing the requested time.

Ambiguous local time

During a fall-back transition, some local times occur twice.

The backend rejects ambiguous local times because the request cannot safely identify which occurrence the parent intended.

This avoids silently creating a booking at an unexpected instant.

8. Availability Design

Parents provide:

date
timezone
from
to

For example:

Date:     2026-09-28
Timezone: America/New_York
From:     16:00
To:       20:00

The backend:

Interprets the range in the parent's timezone.
Converts the range to UTC.
Checks mentor working hours.
Converts mentor availability into the relevant UTC period.
Checks existing confirmed bookings.
Checks mentor daily capacity.
Returns only complete one-hour slots.

The availability endpoint is advisory.

The booking endpoint performs the authoritative availability check again because another user could book the slot between availability lookup and booking.

9. Mentor Availability

The seeded application contains 10 mentors distributed across multiple timezones.

Mentors 1–4
Asia/Kolkata
09:00–21:00

Mentors 5–7
Europe/London
09:00–17:00

Mentors 8–10
America/New_York
09:00–17:00

Mentors are available Monday through Saturday.

This distribution allows the application to demonstrate cross-timezone scheduling instead of restricting every mentor to one timezone.

10. Mentor Assignment

When a parent books a slot, the backend:

Converts the requested local time to UTC.
Finds active mentors whose working hours contain the entire class.
Checks the mentor's local calendar day.
Checks the mentor's confirmed bookings for that local day.
Checks for overlapping bookings.
Locks the mentor row during the critical allocation operation.
Assigns the first eligible mentor.
Creates the booking inside the same transaction.

A mentor cannot exceed:

2 confirmed classes per local calendar day
11. Concurrency Handling

Availability results can become stale immediately after they are returned.

For example:

Parent A → sees slot available
Parent B → sees slot available

Parent A → books
Parent B → books at almost the same time

The booking operation therefore performs the final availability check inside a database transaction.

The mentor row is locked using:

SELECT ... FOR UPDATE

The transaction then checks:

mentor daily capacity
overlapping confirmed bookings

and creates the booking only if the mentor is still available.

This prevents two concurrent requests from assigning the same mentor to overlapping classes.

The application was also manually tested with 11 simultaneous booking requests for the same slot. The system accepted 10 bookings and rejected the remaining request once all 10 mentors were occupied.

12. Cancellation and Rebooking

Cancelled bookings are not treated as active bookings.

Conflict queries only consider:

CONFIRMED

bookings.

Therefore:

CONFIRMED
   ↓
CANCELLED
   ↓
slot becomes available again

The same slot can subsequently be booked again if a mentor is available.

13. Database Design
Parent

Stores:

name
email
timezone
Mentor

Stores:

name
email
timezone
active status
MentorAvailability

Stores:

mentor
day of week
local start time
local end time
Booking

Stores:

parent
mentor
UTC start time
UTC end time
parent timezone
status
meeting link

Booking timestamps are stored as UTC.

14. API Endpoints
Availability
GET /api/availability

Query parameters:

date
timezone
from
to

Example:

/api/availability?date=2026-09-28&timezone=America/New_York&from=16:00&to=20:00

Returns available one-hour slots.

Create Booking
POST /api/bookings

The request contains:

parent name
parent email
parent timezone
local start time
selected slot

The backend performs timezone conversion and mentor allocation.

Get Booking
GET /api/bookings/:id

Returns:

parent
mentor
status
parent-local class time
mentor-local class time
meeting link
Cancel Booking
POST /api/bookings/:id/cancel

Changes the booking status to:

CANCELLED
Mentors
GET /api/mentors

Returns the seeded active mentors.

Mentor Bookings
GET /api/mentors/:mentorId/bookings

Returns bookings assigned to the selected mentor.

15. Error Handling

The API uses different status codes for different types of failures.

400
Invalid request / validation / timezone / time

409
Business conflict / no mentor available

500
Unexpected server error

Examples of handled cases:

invalid timezone
invalid date
past booking
invalid time range
requested slot outside mentor availability
DST nonexistent local time
DST ambiguous local time
no available mentor
overlapping booking
mentor daily capacity reached
16. Local Setup
Prerequisites

Install:

Node.js
npm
Docker Desktop
16.1 Clone Repository
git clone <repository-url>
cd codeyoung_assignment
16.2 Start PostgreSQL

From the project root:

docker compose up -d

Check:

docker ps

The PostgreSQL container should be running.

17. Backend Setup
cd backend
npm install

Create:

backend/.env

with:

DATABASE_URL="postgresql://codeyoung:codeyoung_dev_password@localhost:5432/codeyoung?schema=public"
PORT=5000

Run Prisma migrations:

npx prisma migrate dev

Seed the database:

npx prisma db seed

Start the backend:

npm run dev

Backend:

http://localhost:5000
18. Frontend Setup

Open another terminal:

cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173
19. Testing

Backend tests:

cd backend
npm test

Backend production build:

npm run build

Frontend production build:

cd frontend
npm run build
20. Example Demo Flow

A typical parent booking flow is:

Open application
      ↓
Book a Class
      ↓
Select timezone
      ↓
Select date
      ↓
Select preferred time range
      ↓
Find Available Times
      ↓
Select one-hour slot
      ↓
Enter parent details
      ↓
Confirm Booking
      ↓
View mentor + local times + meeting link

The mentor dashboard can then be used to view the assigned class.

21. Important Edge Cases Considered

The implementation considers:

No mentor available.
All mentors occupied for a selected slot.
Mentor daily limit reached.
Existing overlapping booking.
Concurrent booking requests.
Cancellation followed by rebooking.
Past date/time.
Invalid timezone.
Invalid time range.
Requested range shorter than one hour.
Requested slot not completely inside the preferred range.
Mentor working hours crossing timezone boundaries.
Parent and mentor being in different timezones.
Parent and mentor having different local calendar dates.
DST spring-forward nonexistent times.
DST fall-back ambiguous times.
Duplicate booking attempts.
22. Scope Decisions

The assignment is implemented as an MVP focused on the scheduling problem.

The following are intentionally outside the scope:

Real Zoom/Google Meet integration
Real email delivery
SMS notifications
Payments
OAuth authentication
Full admin CMS
Mobile application
Microservices
Kubernetes
Kafka/RabbitMQ
AI-based mentor matching
External calendar synchronization
Real-time chat

A dummy meeting link is generated instead of integrating with an external video provider.

23. Design Decisions
UTC as canonical time

All booking timestamps are stored in UTC to avoid ambiguity when working across timezones.

IANA timezones

IANA identifiers are stored instead of fixed UTC offsets so DST rules remain available.

Booking-time validation

Availability is calculated for user experience, but booking performs the final availability check again.

Transactional mentor allocation

Mentor locking and booking creation occur within a database transaction to handle concurrent requests.

Confirmed-only conflict detection

Cancelled bookings should not consume capacity, so conflict and capacity calculations consider confirmed bookings only.

Simple layered architecture

The application uses controllers, services, and repositories instead of introducing unnecessary distributed infrastructure for an MVP of this size.

24. Testing Highlights

The implementation was tested for:

Timezone conversion.
DST nonexistent times.
DST ambiguous times.
Availability generation.
Cross-timezone mentor assignment.
Mentor daily capacity.
No-availability scenarios.
Concurrent booking requests.
Cancellation.
Rebooking after cancellation.
Half-hour timezone-derived slots.
Backend build.
Frontend build.
25. AI-Assisted Development

AI was used as a development assistant for:

Requirements analysis.
Edge-case identification.
Architecture discussion.
Database design.
Timezone/DST reasoning.
Implementation assistance.
Debugging.
Test planning.
Documentation.

The development transcript is included separately in:

TRANSCRIPT.md

The transcript records the actual development conversation and decisions rather than presenting a fabricated development history.