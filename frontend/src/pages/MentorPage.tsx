import { useEffect, useState } from "react";
import { DateTime } from "luxon";

import { getMentorBookings, getMentors } from "../api/booking.api";
import type { Booking } from "../types/booking";
import type { MentorSummary } from "../api/booking.api";

function MentorPage() {
  const [mentors, setMentors] = useState<MentorSummary[]>([]);
  const [selectedMentor, setSelectedMentor] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mentorTimezone, setMentorTimezone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMentors() {
      try {
        const result = await getMentors();
        setMentors(result.mentors);
        if (result.mentors.length > 0) setSelectedMentor(result.mentors[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load mentors.");
      }
    }
    loadMentors();
  }, []);

  useEffect(() => {
    if (!selectedMentor) return;

    async function loadBookings() {
      setLoading(true);
      setError(null);
      try {
        const result = await getMentorBookings(selectedMentor);
        setBookings(result.bookings);
        setMentorTimezone(result.mentor.timezone);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load bookings.");
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [selectedMentor]);

  const confirmedCount = bookings.filter((booking) => booking.status === "CONFIRMED").length;

  return (
    <main className="page mentor-page">
      <section className="dashboard-hero">
        <div>
          <div className="pill"><span className="pill-dot" /> Demo mentor dashboard</div>
          <h1>Your trial classes, <span>all in one place.</span></h1>
          <p>See assigned learners and upcoming classes in your own local timezone.</p>
        </div>
        <div className="dashboard-icon">👨‍🏫</div>
      </section>

      <section className="card mentor-selector-card">
        <div className="card-heading">
          <div className="heading-icon">👤</div>
          <div>
            <p className="eyebrow">MENTOR</p>
            <h2>Select a seeded mentor</h2>
            <p>Demo mode for the assignment.</p>
          </div>
        </div>
        <label htmlFor="mentor">Mentor</label>
        <select id="mentor" value={selectedMentor} onChange={(event) => setSelectedMentor(event.target.value)}>
          {mentors.map((mentor) => (
            <option key={mentor.id} value={mentor.id}>{mentor.name} — {mentor.timezone}</option>
          ))}
        </select>
      </section>

      {error && <div className="error-message"><span>!</span>{error}</div>}

      {!loading && !error && selectedMentor && (
        <div className="dashboard-stats">
          <div className="stat-card"><span>📚</span><div><strong>{confirmedCount}</strong><small>Confirmed classes</small></div></div>
          <div className="stat-card"><span>🌎</span><div><strong>{mentorTimezone}</strong><small>Your local timezone</small></div></div>
          <div className="stat-card"><span>⏱️</span><div><strong>60 min</strong><small>Each trial class</small></div></div>
        </div>
      )}

      {loading && <section className="card loading-card"><div className="loading-spinner" /><p>Loading assigned classes...</p></section>}

      {!loading && !error && (
        <section className="card classes-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">YOUR SCHEDULE</p>
              <h2>Assigned trial classes</h2>
            </div>
            <span className="timezone-label">{mentorTimezone}</span>
          </div>

          {bookings.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🗓️</div><h3>No classes assigned</h3><p>New trial bookings will appear here.</p></div>
          ) : (
            <div className="mentor-bookings">
              {bookings.map((booking) => {
                const start = DateTime.fromISO(booking.mentor.start, { setZone: true });
                const end = DateTime.fromISO(booking.mentor.end, { setZone: true });
                return (
                  <article className="booking-item" key={booking.id}>
                    <div className="booking-item-header">
                      <div className="class-date"><span className="date-day">{start.toFormat("dd")}</span><div><strong>{start.toFormat("ccc")}</strong><small>{start.toFormat("LLL yyyy")}</small></div></div>
                      <span className={`status status-${booking.status.toLowerCase()}`}>{booking.status}</span>
                    </div>
                    <div className="class-time"><span>◷</span>{start.toFormat("hh:mm a")} – {end.toFormat("hh:mm a")}</div>
                    <div className="parent-details">
                      <div><span>Learner / parent</span><strong>{booking.parent.name}</strong></div>
                      <div><span>Email</span><strong>{booking.parent.email}</strong></div>
                    </div>
                    <a className="button" href={booking.meetingLink} target="_blank" rel="noreferrer">Open Class Link →</a>
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
