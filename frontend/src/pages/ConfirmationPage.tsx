import { Link, useLocation } from "react-router-dom";

import type { Booking } from "../types/booking";
import {
  formatLocalDateTime,
} from "../utils/timezone";

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
        <section className="card">
          <h1>Booking not found</h1>
          <p>
            No booking information is available on this page.
          </p>

          <Link to="/book" className="button">
            Book a Trial Class
          </Link>
        </section>
      </main>
    );
  }

  const { booking, parentTimezone } = state;

  return (
    <main className="page">
      <section className="card confirmation-card">
        <div className="success-icon">✓</div>

        <h1>Trial Class Booked!</h1>

        <p className="muted">
          Your trial class has been successfully scheduled.
        </p>

        <div className="confirmation-section">
          <h2>Class Details</h2>

          <div className="detail-row">
            <span>Mentor</span>
            <strong>{booking.mentor.name}</strong>
          </div>

          <div className="detail-row">
            <span>Your time</span>
            <strong>
              {formatLocalDateTime(
                booking.mentor.start,
                parentTimezone,
              )}
            </strong>
          </div>

          <div className="detail-row">
            <span>Mentor's time</span>
            <strong>
              {formatLocalDateTime(
                booking.mentor.start,
                booking.mentor.timezone,
              )}
            </strong>
          </div>

          <div className="detail-row">
            <span>Duration</span>
            <strong>60 minutes</strong>
          </div>
        </div>

        <div className="meeting-box">
          <span>Live class link</span>

          <a
            href={booking.meetingLink}
            target="_blank"
            rel="noreferrer"
          >
            {booking.meetingLink}
          </a>
        </div>

        <Link to="/book" className="button">
          Book Another Class
        </Link>
      </section>
    </main>
  );
}

export default ConfirmationPage;