import { Link, useLocation } from "react-router-dom";

import type { Booking } from "../types/booking";
import { formatLocalDateTime } from "../utils/timezone";

interface ConfirmationState {
  booking: Booking;
  parentTimezone: string;
}

function ConfirmationPage() {
  const location = useLocation();
  const state = location.state as ConfirmationState | null;

  if (!state) {
    return (
      <main className="page">
        <section className="card confirmation-card missing-confirmation">
          <div className="empty-icon">📅</div>
          <p className="eyebrow">BOOKING</p>
          <h1>Booking information not found</h1>
          <p className="muted">Start a new booking to see your class confirmation here.</p>
          <Link to="/book" className="hero-button">Book a Trial Class →</Link>
        </section>
      </main>
    );
  }

  const { booking, parentTimezone } = state;

  return (
    <main className="page confirmation-page">
      <section className="confirmation-hero">
        <div className="success-icon">✓</div>
        <p className="eyebrow">YOU'RE ALL SET</p>
        <h1>Your trial class is booked!</h1>
        <p>Your mentor has been assigned. Here are the details you'll need for the class.</p>
      </section>

      <section className="card confirmation-card">
        <div className="confirmation-topline">
          <div><span>Mentor</span><strong>{booking.mentor.name}</strong></div>
          <span className="status status-confirmed">CONFIRMED</span>
        </div>

        <div className="time-highlight">
          <div className="calendar-icon">🗓️</div>
          <div>
            <span>Your local time</span>
            <strong>{formatLocalDateTime(booking.mentor.start, parentTimezone)}</strong>
          </div>
        </div>

        <div className="confirmation-grid">
          <div className="detail-tile">
            <span>Mentor's local time</span>
            <strong>{formatLocalDateTime(booking.mentor.start, booking.mentor.timezone)}</strong>
          </div>
          <div className="detail-tile">
            <span>Duration</span>
            <strong>60 minutes</strong>
          </div>
          <div className="detail-tile">
            <span>Timezone</span>
            <strong>{parentTimezone}</strong>
          </div>
          <div className="detail-tile">
            <span>Booking ID</span>
            <strong className="truncate">{booking.id}</strong>
          </div>
        </div>

        <div className="meeting-box">
          <div className="meeting-icon">▶</div>
          <div>
            <span>Your live-class link</span>
            <strong>Ready for your trial</strong>
          </div>
          <a href={booking.meetingLink} target="_blank" rel="noreferrer">Join class →</a>
        </div>

        <div className="confirmation-actions">
          <Link to="/" className="secondary-button">Back to home</Link>
          <Link to="/book" className="hero-button">Book Another Class →</Link>
        </div>
      </section>
    </main>
  );
}

export default ConfirmationPage;
