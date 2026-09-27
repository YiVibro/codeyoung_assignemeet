# CodeYoung Trial Class Booking System

A full-stack trial-class appointment booking system built for the CodeYoung Full-Stack Development Assignment.

The system allows parents to select a preferred date, local time range, and timezone. It finds available one-hour trial-class slots and assigns an available mentor while handling timezone conversion, daylight-saving-time edge cases, mentor daily capacity, overlapping bookings, and concurrent booking requests.


# 1. Quick Start

## Prerequisites

Make sure the following are installed:

- Node.js 20+
- npm
- Docker Desktop
- Git


## 1. Clone the Repository

```bash
git clone https://github.com/YiVibro/codeyoung_assignemeet
cd codeyoung_assignment
```

## 2. Start PostgreSQL
The project uses PostgreSQL through Docker Compose.

From the project root:
```bash
docker compose up -d
```

Verify that the PostgreSQL container is running:
```bash 
docker ps
```

The project uses:
```text
Database: codeyoung
Username: codeyoung
Password: codeyoung_dev_password
Port: 5432
```
## 3. Set Up the Backend
Open a terminal in the project root:
```bash
cd backend
```
Install dependencies:
```bash
npm install
```
Create a file:
```text
backend/.env
```
Add:
```text
DATABASE_URL="postgresql://codeyoung:codeyoung_dev_password@localhost:5432/codeyoung?schema=public"
PORT=5000
```
Apply the existing Prisma migrations:
```bash
npx prisma migrate deploy
```
Seed the database with the sample mentors and availability:
```bash
npx prisma db seed
```
Start the backend:
```bash
npm run dev
```
The backend will run on:
```text
http://localhost:5000
```
## 4. Set Up the Frontend

Open another terminal.

From the project root:
```bash
cd frontend
```
Install dependencies:
```bash
npm install
```
Start the development server:
```bash
npm run dev
```
The frontend will normally run on:
```text
http://localhost:5173
```

Open that address in a browser.

## 5. Quick Demo
```text
Once both the backend and frontend are running:

1.Open http://localhost:5173.
2.Select Book a Class.
3.Select the parent's timezone.
4.Select a future date.
5.Select a preferred local time range.
6.Click Find Available Times.
7.Select an available one-hour slot.
8.Enter the parent's name and email.
9.Confirm the booking.
10.View the assigned mentor.
11.View the class time in the parent's timezone.
12.View the class time in the mentor's timezone.
13.Open the dummy meeting link.
14.Use the Mentor Dashboard to view the mentor's assigned classes.
```

## 6. Testing
Backend tests
From the backend directory:
```bash
npm test
```
Backend production build
```bash
npm run build
```
Frontend production build

From the frontend directory:
```bash
npm run build
```

## 7. Project Overview
### Problem Statement


CodeYoung has:

- 10 mentors
- Up to 2 trial classes per mentor per day
- Up to 20 trial classes per day
- Parents who may be located in different timezones
- Mentors who may also work in different timezones

A parent should be able to:

- Select their timezone.
- Select a future date.
- Select a preferred local time range.
- View available one-hour slots.
- Select a slot.
- Enter their details.
- Confirm the booking.

The system then assigns an available mentor and generates a dummy live-class link.

Both the parent and mentor should see the class time in their own timezone.


## 8. Demo Credentials
- No authentication is required for this MVP.
- The application can be used directly after starting the frontend and backend.
- The mentor dashboard uses seeded mentor records rather than a login system.

## 9. Important Implementation Notes
- Booking timestamps are stored in UTC.
- IANA timezone identifiers are used instead of fixed UTC offsets.
- Luxon handles timezone conversion and DST validation.
- Mentor availability is defined in each mentor's local timezone.
- Each mentor can have at most 2 confirmed classes per local calendar day.
- Booking availability is checked again inside the booking transaction.
- Mentor rows are locked during mentor allocation to handle concurrent booking requests.
- Cancelled bookings do not consume mentor capacity.
- A cancelled slot can be booked again when a mentor is available.

<br>

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

<br>

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


<br>

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
```
The application uses a layered backend design so that HTTP handling, business rules, and database operations remain separated.

<br>

# 5. Project Structure
```text
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
```
<br>

# 6. Timezone Design

Timezone handling is based on IANA timezone identifiers.

Examples:

```text
America/New_York
Europe/London
Asia/Kolkata
```

The system does not store timezone offsets such as:
```text
UTC-04:00
UTC+05:30
```
because offsets can change due to daylight saving time.

Instead:

Booking timestamps are stored in UTC.
Parent timezone is stored with the booking.
Mentor timezone is stored with the mentor.
Luxon is used for timezone conversion.
Display times are converted from UTC into the relevant local timezone.

Conceptually:
```text
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
```
This makes the UTC timestamp the canonical representation of the booking.

<br>

# 7. Daylight Saving Time

The system explicitly handles DST edge cases.

### 1) Nonexistent local time

During a spring-forward transition, some local times do not exist.

Example:
```text
02:30
```

may disappear when clocks move from 02:00 to 03:00.

The backend rejects such a booking instead of silently changing the requested time.

### 2) Ambiguous local time

During a fall-back transition, some local times occur twice.

The backend rejects ambiguous local times because the request cannot safely identify which occurrence the parent intended.

This avoids silently creating a booking at an unexpected instant.

<br>

# 8. Availability Design

Parents provide:
```text
date
timezone
from
to
```

For example:
```text
Date:     2026-09-28
Timezone: America/New_York
From:     16:00
To:       20:00
```
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

<br>

# 9. Mentor Availability

The seeded application contains 10 mentors distributed across multiple timezones.

```text
Mentors 1–4
Asia/Kolkata
09:00–21:00

Mentors 5–7
Europe/London
09:00–17:00

Mentors 8–10
America/New_York
09:00–17:00
```
#### Mentors are available Monday through Saturday.

This distribution allows the application to demonstrate cross-timezone scheduling instead of restricting every mentor to one timezone.

<br>

# 10. Mentor Assignment

When a parent books a slot, the backend:

- Converts the requested local time to UTC.
- Finds active mentors whose working hours contain the entire class.
- Checks the mentor's local calendar day.
- Checks the mentor's confirmed bookings for that local day.
- Checks for overlapping bookings.
- Locks the mentor row during the critical allocation operation.
- Assigns the first eligible mentor.
- Creates the booking inside the same transaction.


A mentor cannot exceed:
<b>2 confirmed classes per local calendar day</b>

<br>

# 11. Concurrency Handling

Availability results can become stale immediately after they are returned.

For example:
```text
Parent A → sees slot available
Parent B → sees slot available

Parent A → books
Parent B → books at almost the same time
```

The booking operation therefore performs the final availability check inside a database transaction.

The mentor row is locked using:
```sql
SELECT ... FOR UPDATE
```

The transaction then checks:

- mentor daily capacity
overlapping confirmed bookings

- and creates the booking only if the mentor is still available.

This prevents two concurrent requests from assigning the same mentor to overlapping classes.

<b>The application was also manually tested with 11 simultaneous booking requests for the same slot. The system accepted 10 bookings and rejected the remaining request once all 10 mentors were occupied.</b>

<br>

# 12. Cancellation and Rebooking

Cancelled bookings are not treated as active bookings.

Conflict queries only consider:
```text
CONFIRMED
```
bookings.

Therefore:
```text
CONFIRMED
   ↓
CANCELLED
   ↓
Slot becomes available again
```

The same slot can subsequently be booked again if a mentor is available.

<br>

# 13. Database Design
#### Parent
```text
name
email
timezone
```
#### Mentor
```text
name
email
timezone
active status
```

#### MentorAvailability
```text
mentor
day of week
local start time
local end time
```
#### Booking
```text
parent
mentor
UTC start time
UTC end time
parent timezone
status
meeting link
```

Booking timestamps are stored as UTC.

<br>

# 14. API Endpoints
### 1. Availability
```js
GET /api/availability
```

#### Query parameters:
```text
date
timezone
from
to
```

Example:
```text
/api/availability?date=2026-09-28&timezone=America/New_York&from=16:00&to=20:00
```
Returns available one-hour slots.

---

### 2. Create Booking
```js
POST /api/bookings
```

### The request contains:
```text
parent name
parent email
parent timezone
local start time
selected slot
```

The backend performs timezone conversion and mentor allocation.

---

### 3. Get Booking
```js
GET /api/bookings/:id
```
#### Returns:
```text
parent
mentor
status
parent-local class time
mentor-local class time
meeting link
```
---

### 4. Cancel Booking
```js
POST /api/bookings/:id/cancel
```

#### Changes the booking status to:
```text
CANCELLED
```
---

### 5. Mentors
```js
GET /api/mentors
```

#### Returns the seeded active mentors.

---

### 6. Mentor Bookings
```js
GET /api/mentors/:mentorId/bookings
```

#### Returns bookings assigned to the selected mentor.

<br>

# 15. Error Handling

The API uses different status codes for different types of failures.

```text
400
Invalid request / validation / timezone / time

409
Business conflict / no mentor available

500
Unexpected server error
```
Examples of handled cases:

- invalid timezone
- invalid date
- past booking
- invalid time range
- requested slot outside mentor availability
- DST non-existent local time
- DST ambiguous local time
- no available mentor
- overlapping booking
- mentor daily capacity reached

<br>

# 16. Important Edge Cases Considered

The implementation considers:

- No mentor available.
- All mentors occupied for a selected slot.
- Mentor daily limit reached.
- Existing overlapping booking.
- Concurrent booking requests.
- Cancellation followed by rebooking.
- Past date/time.
- Invalid timezone.
- Invalid time range.
- Requested range shorter than one hour.
- Requested slot not completely inside the preferred range.
- Mentor working hours crossing timezone boundaries.
- Parent and mentor being in different timezones.
- Parent and mentor having different local calendar dates.
- DST spring-forward nonexistent times.
- DST fall-back ambiguous times.
- Duplicate booking attempts.

<br>

# 17. Scope Decisions

The assignment is implemented as an MVP focused on the scheduling problem.

The following are intentionally outside the scope:

- Real Zoom/Google Meet integration
- Real email delivery
- SMS notifications
- Payments
- OAuth authentication
- Full admin CMS
- Mobile application
- Microservices
- Kubernetes
- Kafka/RabbitMQ
- AI-based mentor matching
- External calendar
- Synchronization
- Real-time chat

A dummy meeting link is generated instead of integrating with an external video provider.

<br>

# 18. Design Decisions
#### • UTC as canonical time
All booking timestamps are stored in UTC to avoid ambiguity when working across timezones.

#### • IANA timezones

IANA identifiers are stored instead of fixed UTC offsets so DST rules remain available.

#### • Booking-time validation

Availability is calculated for user experience, but booking performs the final availability check again.

#### • Transactional mentor allocation

Mentor locking and booking creation occur within a database transaction to handle concurrent requests.

#### • Confirmed-only conflict detection

Cancelled bookings should not consume capacity, so conflict and capacity calculations consider confirmed bookings only.

#### • Simple layered architecture

The application uses controllers, services, and repositories instead of introducing unnecessary distributed infrastructure for an MVP of this size.

<br>

# 19. Testing Highlights

The implementation was tested for:

- Timezone conversion.
- DST nonexistent times.
- DST ambiguous times.
- Availability generation.
- Cross-timezone mentor assignment.
- Mentor daily capacity.
- No-availability scenarios.
- Concurrent booking requests.
- Cancellation.
- Rebooking after cancellation.
- Half-hour timezone-derived slots.
- Backend build.
- Frontend build.

<br>

# 20. AI-Assisted Development

#### AI was used as a development assistant for:

- Requirements analysis.
- Edge-case identification.
- Architecture discussion.
- Database design.
- Timezone/DST reasoning.
- Implementation assistance.
- Debugging.
- Test planning.
- Documentation.

The development transcript is included separately in:

[TRANSCRIPT](https://github.com/YiVibro/codeyoung_assignemeet/blob/b2a920fdbac999bdfa0b559862f2272e7bdd8bc5/TRANSCRIPT.md)

The transcript records the actual development conversation and decisions rather than presenting a fabricated development history.