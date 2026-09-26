import { useEffect, useState } from "react";
import { DateTime } from "luxon";

import {
  getMentorBookings,
  getMentors,
} from "../api/booking.api";

import type {
  Booking,
} from "../types/booking";

import type {
  MentorSummary,
} from "../api/booking.api";

function MentorPage() {
  const [mentors, setMentors] = useState<MentorSummary[]>([]);
  const [selectedMentor, setSelectedMentor] =
    useState("");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mentorTimezone, setMentorTimezone] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadMentors() {
      try {
        const result = await getMentors();

        setMentors(result.mentors);

        if (result.mentors.length > 0) {
          setSelectedMentor(result.mentors[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load mentors.",
        );
      }
    }

    loadMentors();
  }, []);

  useEffect(() => {
    if (!selectedMentor) {
      return;
    }

    async function loadBookings() {
      setLoading(true);
      setError(null);

      try {
        const result =
          await getMentorBookings(selectedMentor);

        setBookings(result.bookings);
        setMentorTimezone(result.mentor.timezone);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load bookings.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, [selectedMentor]);

  return (
    <main className="page">
      <section className="booking-header">
        <p className="eyebrow">
          MENTOR DASHBOARD
        </p>

        <h1>Assigned Trial Classes</h1>

        <p className="subtitle">
          View your upcoming and previous trial
          classes in your local timezone.
        </p>
      </section>

      <section className="card">
        <div className="section-heading">
          <span className="step-number">1</span>

          <div>
            <h2>Select mentor</h2>
            <p>
              Demo mode — select a seeded mentor.
            </p>
          </div>
        </div>

        <label htmlFor="mentor">
          Mentor
        </label>

        <select
          id="mentor"
          value={selectedMentor}
          onChange={(event) =>
            setSelectedMentor(event.target.value)
          }
        >
          {mentors.map((mentor) => (
            <option
              key={mentor.id}
              value={mentor.id}
            >
              {mentor.name} — {mentor.timezone}
            </option>
          ))}
        </select>
      </section>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <section className="card">
          <p className="muted">
            Loading assigned classes...
          </p>
        </section>
      )}

      {!loading && !error && (
        <section className="card">
          <div className="section-heading">
            <span className="step-number">2</span>

            <div>
              <h2>Your classes</h2>

              <p>
                All times are shown in{" "}
                <strong>
                  {mentorTimezone}
                </strong>
                .
              </p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="empty-state">
              <strong>No classes assigned.</strong>

              <p>
                New trial bookings will appear here.
              </p>
            </div>
          ) : (
            <div className="mentor-bookings">
              {bookings.map((booking) => {
                const start =
                  DateTime.fromISO(
                    booking.mentor.start,
                    { setZone: true },
                  );

                const end =
                  DateTime.fromISO(
                    booking.mentor.end,
                    { setZone: true },
                  );

                return (
                  <article
                    className="booking-item"
                    key={booking.id}
                  >
                    <div className="booking-item-header">
                      <div>
                        <h3>
                          {start.toFormat(
                            "ccc, dd LLL yyyy",
                          )}
                        </h3>

                        <p className="booking-time">
                          {start.toFormat(
                            "hh:mm a",
                          )}
                          {" – "}
                          {end.toFormat(
                            "hh:mm a",
                          )}
                        </p>
                      </div>

                      <span
                        className={`status status-${booking.status.toLowerCase()}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="parent-details">
                      <div>
                        <span>Parent</span>
                        <strong>
                          {booking.parent.name}
                        </strong>
                      </div>

                      <div>
                        <span>Email</span>
                        <strong>
                          {booking.parent.email}
                        </strong>
                      </div>
                    </div>

                    <a
                      className="button"
                      href={booking.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Class Link
                    </a>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default MentorPage;