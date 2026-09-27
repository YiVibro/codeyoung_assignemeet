import { DateTime } from "luxon";
import { ApiError } from "./api-error.js";

export function isValidTimezone(
  timezone: string,
): boolean {
  return DateTime.now().setZone(timezone).isValid;
}

export function parseDateInTimezone(
  date: string,
  timezone: string,
): DateTime {
  if (!isValidTimezone(timezone)) {
    throw new ApiError(
      400,
      "INVALID_TIMEZONE",
      `Invalid timezone: ${timezone}`,
    );
  }

  const dateTime = DateTime.fromISO(date, {
    zone: timezone,
  });

  if (
    !dateTime.isValid ||
    dateTime.toFormat("yyyy-MM-dd") !== date
  ) {
    throw new ApiError(
      400,
      "INVALID_DATE",
      "Invalid calendar date.",
    );
  }

  return dateTime;
}

export function localToUtc(
  localDateTime: string,
  timezone: string,
): DateTime {
  if (!isValidTimezone(timezone)) {
    throw new ApiError(
      400,
      "INVALID_TIMEZONE",
      `Invalid timezone: ${timezone}`,
    );
  }

  const dateTime = DateTime.fromISO(
    localDateTime,
    {
      zone: timezone,
      setZone: true,
    },
  );

  if (!dateTime.isValid) {
    throw new ApiError(
      400,
      "INVALID_DATETIME",
      "Invalid local date/time.",
    );
  }

  const requested = localDateTime.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/,
  );

  if (!requested) {
    throw new ApiError(
      400,
      "INVALID_DATETIME",
      "Datetime must use ISO local datetime format.",
    );
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second = "0",
  ] = requested;

  const sameWallClock =
    dateTime.year === Number(year) &&
    dateTime.month === Number(month) &&
    dateTime.day === Number(day) &&
    dateTime.hour === Number(hour) &&
    dateTime.minute === Number(minute) &&
    dateTime.second === Number(second);

  if (!sameWallClock) {
    throw new ApiError(
      400,
      "NONEXISTENT_LOCAL_TIME",
      `The selected local time does not exist in ${timezone} because of a daylight-saving time transition.`,
    );
  }

  /*
   * DST fall-back protection.
   *
   * Some local times occur twice.
   *
   * Example:
   *
   * 01:30 EDT
   * 01:30 EST
   *
   * Luxon exposes both possible offsets.
   */
  const possibleOffsets =
    dateTime.getPossibleOffsets();

  if (possibleOffsets.length > 1) {
    throw new ApiError(
      400,
      "AMBIGUOUS_LOCAL_TIME",
      `The selected local time is ambiguous in ${timezone} because of a daylight-saving time transition.`,
    );
  }

  return dateTime.toUTC();
}

export function utcToTimezone(
  utcDate: Date,
  timezone: string,
): DateTime {
  if (!isValidTimezone(timezone)) {
    throw new ApiError(
      400,
      "INVALID_TIMEZONE",
      `Invalid timezone: ${timezone}`,
    );
  }

  return DateTime.fromJSDate(
    utcDate,
    { zone: "utc" },
  ).setZone(timezone);
}

export function getLocalDate(
  utcDate: Date,
  timezone: string,
): string {
  return utcToTimezone(
    utcDate,
    timezone,
  ).toFormat("yyyy-MM-dd");
}

export function getLocalDayOfWeek(
  utcDate: Date,
  timezone: string,
): number {
  return utcToTimezone(
    utcDate,
    timezone,
  ).weekday;
}