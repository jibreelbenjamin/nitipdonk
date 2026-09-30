import { LIVE_WINDOW_HOURS } from "./constants";

type TripState = { status: "OPEN" | "CLOSED" | "DONE"; closesAt: Date | null };

export function isAcceptingOrders(trip: TripState, now = new Date()) {
  return trip.status === "OPEN" && (!trip.closesAt || trip.closesAt > now);
}

export function liveSince(now = new Date()) {
  return new Date(now.getTime() - LIVE_WINDOW_HOURS * 60 * 60 * 1000);
}

