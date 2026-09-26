export interface AvailabilitySlot {
  start: string;
  end: string;
}

export interface AvailabilityResponse {
  date: string;
  timezone: string;
  from: string;
  to: string;
  slots: AvailabilitySlot[];
}

export interface CreateBookingRequest {
  parent: {
    name: string;
    email: string;
    timezone: string;
  };
  start: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  timezone: string;
}

export interface Mentor {
  id: string;
  name: string;
  email?: string;
  timezone: string;
}

export type BookingStatus =
  | "CONFIRMED"
  | "CANCELLED";

export interface Booking {
  id: string;
  status: BookingStatus;
  parent: Parent;
  mentor: Mentor & {
    start: string;
    end: string;
  };
  meetingLink: string;
}

export interface BookingResponse {
  booking: Booking;
}

export interface MentorBookingsResponse {
  mentor: {
    id: string;
    name: string;
    timezone: string;
  };
  bookings: Booking[];
}