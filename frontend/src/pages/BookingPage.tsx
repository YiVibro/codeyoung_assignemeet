import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { DateTime } from "luxon";
import { useNavigate } from "react-router-dom";

import { createBooking, getAvailability } from "../api/booking.api";
import type {AvailabilitySlot} from "../types/booking";

import { TIMEZONES } from "../utils/timezones";
import {
  formatLocalTime,
  getBrowserTimezone,
} from "../utils/timezone";

export default function BookingPage() {
  const navigate = useNavigate();

  const browserTimezone = getBrowserTimezone();

  const [timezone, setTimezone] = useState(
    TIMEZONES.some((tz) => tz.value === browserTimezone)
      ? browserTimezone
      : "Asia/Kolkata",
  );

  const today = useMemo(
    () => DateTime.now().setZone(timezone).toFormat("yyyy-MM-dd"),
    [timezone],
  );

  const [date, setDate] = useState(today);
  const [from, setFrom] = useState("09:00");
  const [to, setTo] = useState("12:00");

  const [availability, setAvailability] = useState<
    AvailabilitySlot[]
  >([]);

  const [selectedSlot, setSelectedSlot] =
    useState<AvailabilitySlot | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [searching, setSearching] = useState(false);
  const [booking, setBooking] = useState(false);

  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  function handleTimezoneChange(value: string) {
    setTimezone(value);
    setAvailability([]);
    setSelectedSlot(null);
    setSearched(false);

    const newToday = DateTime.now()
      .setZone(value)
      .toFormat("yyyy-MM-dd");

    setDate(newToday);
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
      const response = await getAvailability(
        date,
        timezone,
        from,
        to,
      );

      setAvailability(response.slots);
      setSearched(true);
    } catch (err) {
      setAvailability([]);
      setSearched(true);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to find available times.",
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedSlot) {
      setError("Please select an available time.");
      return;
    }

    setError("");
    setBooking(true);

    try {
      const localStart = DateTime.fromISO(
        selectedSlot.start,
        { setZone: true },
      )
        .setZone(timezone)
        .toFormat("yyyy-MM-dd'T'HH:mm:ss");

      const response = await createBooking({
        parent: {
          name: name.trim(),
          email: email.trim(),
          timezone,
        },
        start: localStart,
      });

      navigate("/confirmation", {
        state: {
          booking: response.booking,
          parentTimezone: timezone,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the booking.",
      );
    } finally {
      setBooking(false);
    }
  }

  return (
    <main className="page">
      <section className="booking-page">
        <div className="page-header">
          <p className="eyebrow">Trial Class</p>

          <h1>Book a Trial Class</h1>

          <p>
            Choose your timezone, preferred date and
            comfortable time range.
          </p>
        </div>

        <div className="card">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="timezone">
                Your timezone
              </label>

              <select
                id="timezone"
                value={timezone}
                onChange={(event) =>
                  handleTimezoneChange(event.target.value)
                }
              >
                {TIMEZONES.map((tz) => (
                  <option
                    key={tz.value}
                    value={tz.value}
                  >
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date">
                Preferred date
              </label>

              <input
                id="date"
                type="date"
                min={today}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setAvailability([]);
                  setSelectedSlot(null);
                  setSearched(false);
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="from">
                From
              </label>

              <input
                id="from"
                type="time"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setAvailability([]);
                  setSelectedSlot(null);
                  setSearched(false);
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="to">
                To
              </label>

              <input
                id="to"
                type="time"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value);
                  setAvailability([]);
                  setSelectedSlot(null);
                  setSearched(false);
                }}
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching
              ? "Finding available times..."
              : "Find Available Times"}
          </button>
        </div>

        {searched && (
          <div className="card">
            <div className="section-header">
              <h2>Available Times</h2>

              <span>
                {availability.length}{" "}
                {availability.length === 1
                  ? "slot"
                  : "slots"}
              </span>
            </div>

            {availability.length === 0 ? (
              <p className="empty-message">
                No available classes were found in this
                time range. Try a different time range.
              </p>
            ) : (
              <div className="slot-grid">
                {availability.map((slot) => {
                  const isSelected =
                    selectedSlot?.start === slot.start;

                  return (
                    <button
                      key={slot.start}
                      type="button"
                      className={`slot ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() =>
                        setSelectedSlot(slot)
                      }
                    >
                      <strong>
                        {formatLocalTime(
                          slot.start,
                          timezone,
                        )}
                      </strong>

                      <span>
                        to{" "}
                        {formatLocalTime(
                          slot.end,
                          timezone,
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedSlot && (
          <form
            className="card"
            onSubmit={handleSubmit}
          >
            <div className="section-header">
              <div>
                <h2>Your Details</h2>

                <p>
                  Selected time:{" "}
                  <strong>
                    {formatLocalTime(
                      selectedSlot.start,
                      timezone,
                    )}{" "}
                    –{" "}
                    {formatLocalTime(
                      selectedSlot.end,
                      timezone,
                    )}
                  </strong>
                </p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="name">
                Full name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={booking}
            >
              {booking
                ? "Confirming..."
                : "Confirm Booking"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}