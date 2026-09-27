import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { DateTime } from "luxon";
import { useNavigate } from "react-router-dom";

import { createBooking, getAvailability } from "../api/booking.api";
import type { AvailabilitySlot } from "../types/booking";
import { TIMEZONES } from "../utils/timezones";
import { formatLocalDate, formatLocalTime, getBrowserTimezone } from "../utils/timezone";

export default function BookingPage() {
  const navigate = useNavigate();
  const browserTimezone = getBrowserTimezone();

  const [timezone, setTimezone] = useState(
    TIMEZONES.some((tz) => tz.value === browserTimezone) ? browserTimezone : "Asia/Kolkata",
  );

  const today = useMemo(
    () => DateTime.now().setZone(timezone).toFormat("yyyy-MM-dd"),
    [timezone],
  );

  const [date, setDate] = useState(today);
  const [from, setFrom] = useState("09:00");
  const [to, setTo] = useState("12:00");
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [booking, setBooking] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  function resetSlots() {
    setAvailability([]);
    setSelectedSlot(null);
    setSearched(false);
  }

  function handleTimezoneChange(value: string) {
    setTimezone(value);
    resetSlots();
    setDate(DateTime.now().setZone(value).toFormat("yyyy-MM-dd"));
  }

  async function handleSearch() {
    setError("");
    setSelectedSlot(null);

    if (!from || !to) {
      setError("Please select a preferred start and end time.");
      return;
    }

    if (to <= from) {
      setError("The end time must be after the start time.");
      return;
    }

    const start = DateTime.fromFormat(from, "HH:mm");
    const end = DateTime.fromFormat(to, "HH:mm");

    if (end.diff(start, "minutes").minutes < 60) {
      setError("Please select at least a 1-hour time range.");
      return;
    }

    setSearching(true);

    try {
      const response = await getAvailability(date, timezone, from, to);
      setAvailability(response.slots);
      setSearched(true);
    } catch (err) {
      setAvailability([]);
      setSearched(true);
      setError(err instanceof Error ? err.message : "Unable to find available times.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSlot) {
      setError("Please select an available time.");
      return;
    }

    setError("");
    setBooking(true);

    try {
      const localStart = DateTime.fromISO(selectedSlot.start, { setZone: true })
        .setZone(timezone)
        .toFormat("yyyy-MM-dd'T'HH:mm:ss");

      const response = await createBooking({
        parent: { name: name.trim(), email: email.trim(), timezone },
        start: localStart,
      });

      navigate("/confirmation", {
        state: { booking: response.booking, parentTimezone: timezone },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create the booking.");
    } finally {
      setBooking(false);
    }
  }

  return (
    <main className="page booking-page">
      <div className="booking-hero">
        <div>
          <div className="pill"><span className="pill-dot" /> Free trial class</div>
          <h1>Find a time that works <span>for you.</span></h1>
          <p>
            Choose your local time. We'll match you with an available mentor
            and take care of the timezone conversion.
          </p>
        </div>

        <div className="booking-trust">
          <div className="mini-feature"><span>✓</span><div><strong>60 min</strong><small>Trial class</small></div></div>
          <div className="mini-feature"><span>🌎</span><div><strong>Any timezone</strong><small>Local times shown</small></div></div>
          <div className="mini-feature"><span>🤝</span><div><strong>1:1 mentor</strong><small>Matched for you</small></div></div>
        </div>
      </div>

      <div className="booking-progress">
        <div className="progress-step active"><span>1</span><div><strong>Find a time</strong><small>Choose your preferences</small></div></div>
        <div className="progress-line" />
        <div className={`progress-step ${selectedSlot ? "active" : ""}`}><span>2</span><div><strong>Your details</strong><small>Tell us who is joining</small></div></div>
        <div className="progress-line" />
        <div className="progress-step"><span>3</span><div><strong>Confirmation</strong><small>Get your class link</small></div></div>
      </div>

      <div className="booking-layout">
        <section className="card booking-card">
          <div className="card-heading">
            <div className="heading-icon">🗓️</div>
            <div>
              <p className="eyebrow">STEP 1</p>
              <h2>When would you like to learn?</h2>
              <p>All times below are in your selected timezone.</p>
            </div>
          </div>

          <div className="form-grid booking-form-grid">
            <div className="form-group full">
              <label htmlFor="timezone">Your timezone</label>
              <select id="timezone" value={timezone} onChange={(event) => handleTimezoneChange(event.target.value)}>
                {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
              <span className="field-help">We'll use this timezone when matching you with a mentor.</span>
            </div>

            <div className="form-group">
              <label htmlFor="date">Preferred date</label>
              <input id="date" type="date" min={today} value={date} onChange={(event) => { setDate(event.target.value); resetSlots(); }} />
              <span className="field-help">{formatLocalDate(`${date}T12:00:00`, timezone)}</span>
            </div>

            <div className="form-group">
              <label>Comfortable time range</label>
              <div className="time-inputs">
                <input aria-label="Start time" type="time" value={from} onChange={(event) => { setFrom(event.target.value); resetSlots(); }} />
                <span>to</span>
                <input aria-label="End time" type="time" value={to} onChange={(event) => { setTo(event.target.value); resetSlots(); }} />
              </div>
              <span className="field-help">Choose at least one hour.</span>
            </div>
          </div>

          {error && <div className="error-message"><span>!</span>{error}</div>}

          <button type="button" className="primary-button" onClick={handleSearch} disabled={searching}>
            {searching ? "Finding your best times..." : "Find Available Times →"}
          </button>
        </section>

        {searched && (
          <section className="card availability-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">AVAILABLE TIMES</p>
                <h2>Pick your trial slot</h2>
              </div>
              <span className="slot-count">{availability.length} available</span>
            </div>

            {availability.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🕐</div>
                <h3>No matching times yet</h3>
                <p>Try a wider time range or another date. We'll only show complete one-hour slots.</p>
              </div>
            ) : (
              <>
                <p className="availability-note">Showing times in <strong>{TIMEZONES.find((tz) => tz.value === timezone)?.label ?? timezone}</strong>.</p>
                <div className="slot-grid">
                  {availability.map((slot) => {
                    const isSelected = selectedSlot?.start === slot.start;
                    return (
                      <button key={slot.start} type="button" className={`slot ${isSelected ? "selected" : ""}`} onClick={() => setSelectedSlot(slot)}>
                        <span className="slot-check">{isSelected ? "✓" : "○"}</span>
                        <strong>{formatLocalTime(slot.start, timezone)}</strong>
                        <span>{formatLocalTime(slot.end, timezone)}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {selectedSlot && (
          <form className="card details-card" onSubmit={handleSubmit}>
            <div className="card-heading">
              <div className="heading-icon yellow-icon">✦</div>
              <div>
                <p className="eyebrow">STEP 2</p>
                <h2>Almost there!</h2>
                <p>Enter your details and we'll confirm the mentor assignment.</p>
              </div>
            </div>

            <div className="selected-summary">
              <div><span>Selected class</span><strong>{formatLocalDate(selectedSlot.start, timezone)}</strong></div>
              <div><span>Your local time</span><strong>{formatLocalTime(selectedSlot.start, timezone)} – {formatLocalTime(selectedSlot.end, timezone)}</strong></div>
              <div><span>Duration</span><strong>60 minutes</strong></div>
            </div>

            <div className="form-grid details-grid">
              <div className="form-group">
                <label htmlFor="name">Parent / learner name</label>
                <input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
              </div>
            </div>

            <button type="submit" className="primary-button" disabled={booking}>
              {booking ? "Confirming your trial..." : "Confirm FREE Trial Class →"}
            </button>
            <p className="privacy-note">No payment required. Your details are used only to create the trial booking.</p>
          </form>
        )}
      </div>
    </main>
  );
}
