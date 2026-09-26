import { get, post } from "./client";

import type {
  AvailabilityResponse,
  BookingResponse,
  CreateBookingRequest,
  MentorBookingsResponse,
} from "../types/booking";

export interface MentorSummary {
  id: string;
  name: string;
  timezone: string;
}

export interface MentorsResponse {
  mentors: MentorSummary[];
}

export async function getAvailability(
  date: string,
  timezone: string,
  from: string,
  to: string,
): Promise<AvailabilityResponse> {
  const params = new URLSearchParams({
    date,
    timezone,
    from,
    to,
  });

  return get<AvailabilityResponse>(
    `/availability?${params.toString()}`,
  );
}

export async function createBooking(
  input: CreateBookingRequest,
): Promise<BookingResponse> {
  return post<BookingResponse>(
    "/bookings",
    input,
  );
}

export async function getBooking(
  bookingId: string,
): Promise<BookingResponse> {
  return get<BookingResponse>(
    `/bookings/${bookingId}`,
  );
}

export async function cancelBooking(
  bookingId: string,
): Promise<BookingResponse> {
  return post<BookingResponse>(
    `/bookings/${bookingId}/cancel`,
    {},
  );
}

export async function getMentorBookings(
  mentorId: string,
): Promise<MentorBookingsResponse> {
  return get<MentorBookingsResponse>(
    `/mentors/${mentorId}/bookings`,
  );
}

export async function getMentors(): Promise<MentorsResponse> {
  return get<MentorsResponse>("/mentors");
}