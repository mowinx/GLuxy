import type { Booking, BookingStatus, Car, Escrow, RateType, Settings } from "./types";
import { BLOCKING } from "./types";

const CODE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function naira(n: number) {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

export function feePerDay(settings: Settings) {
  return settings.platform_fee_per_day + settings.driver_fee_per_day;
}

export function customerDaily(car: Pick<Car, "daily_rate">, settings: Settings) {
  return car.daily_rate + feePerDay(settings);
}

export function customerWeekly(car: Pick<Car, "weekly_rate">, settings: Settings) {
  return car.weekly_rate + 7 * feePerDay(settings);
}

export function customerMonthly(car: Pick<Car, "monthly_rate">, settings: Settings) {
  return car.monthly_rate + 30 * feePerDay(settings);
}

export function isoDate(offsetDays: number, from = new Date()) {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIso() {
  return isoDate(0);
}

export function billedDays(start: string, end: string) {
  const a = Date.parse(start + "T00:00:00");
  const b = Date.parse(end + "T00:00:00");
  return Math.max(1, Math.round((b - a) / 86400000));
}

export function suggestRates(daily: number) {
  return {
    weekly_rate: Math.round(daily * 7 * 0.9),
    monthly_rate: Math.round(daily * 30 * 0.75),
  };
}

export function carRate(car: Pick<Car, "daily_rate" | "weekly_rate" | "monthly_rate">, days: number) {
  if (days >= 30) {
    const months = Math.floor(days / 30);
    const rem = days % 30;
    return {
      amount: months * car.monthly_rate + rem * car.daily_rate,
      rateType: "monthly" as RateType,
    };
  }
  if (days >= 7) {
    const weeks = Math.floor(days / 7);
    const rem = days % 7;
    return {
      amount: weeks * car.weekly_rate + rem * car.daily_rate,
      rateType: "weekly" as RateType,
    };
  }
  return { amount: days * car.daily_rate, rateType: "daily" as RateType };
}

export function quote(
  car: Pick<Car, "daily_rate" | "weekly_rate" | "monthly_rate">,
  start: string,
  end: string,
  settings: Settings,
) {
  const days = billedDays(start, end);
  const { amount, rateType } = carRate(car, days);
  const platform_fee = settings.platform_fee_per_day * days;
  const driver_amount = settings.driver_fee_per_day * days;
  const owner_amount = amount;
  const total_amount = owner_amount + driver_amount + platform_fee;
  return { days, rateType, owner_amount, driver_amount, platform_fee, total_amount, car_rate_total: amount };
}

export function perDayLabel(total: number, days: number) {
  const unit = days === 1 ? "day" : "days";
  return `${naira(Math.round(total / days))} / day × ${days} ${unit}`;
}

export function makeCode() {
  let s = "LUXY-";
  for (let i = 0; i < 6; i++) s += CODE[Math.floor(Math.random() * CODE.length)];
  return s;
}

export function datesInclusive(start: string, end: string) {
  const out: string[] = [];
  const d = new Date(start + "T12:00:00");
  const last = new Date(end + "T12:00:00");
  while (d <= last) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function rangesOverlap(a0: string, a1: string, b0: string, b1: string) {
  return a0 <= b1 && b0 <= a1;
}

export function effectiveStatus(b: Booking, now = Date.now()): BookingStatus {
  if (
    b.status === "active" &&
    b.scheduled_end_at &&
    new Date(b.scheduled_end_at).getTime() < now
  ) {
    return "overdue";
  }
  return b.status;
}

export function isBlocking(b: Booking) {
  return BLOCKING.includes(effectiveStatus(b));
}

export function carBookedOn(bookings: Booking[], carId: string, day: string) {
  return bookings.some(
    (b) => b.car_id === carId && isBlocking(b) && day >= b.start_date && day <= b.end_date,
  );
}

export function rangeFree(bookings: Booking[], carId: string, start: string, end: string, ignoreId?: string) {
  return !bookings.some(
    (b) =>
      b.car_id === carId &&
      b.id !== ignoreId &&
      isBlocking(b) &&
      rangesOverlap(start, end, b.start_date, b.end_date),
  );
}

export function isPublicCar(car: Car) {
  const driven = car.self_driven || !!car.driver_id;
  return car.status === "active" && car.approval_status === "approved" && driven;
}

export function scheduledEnd(activatedAt: string, start: string, end: string) {
  const days = billedDays(start, end);
  return new Date(new Date(activatedAt).getTime() + days * 86400000).toISOString();
}

export function refundFor(total: number, kind: "pre" | "post", settings: Settings) {
  if (kind === "pre") {
    const fee =
      settings.cancellation_fee_type === "flat"
        ? settings.cancellation_fee_value
        : Math.round((total * settings.cancellation_fee_value) / 100);
    return { fee, refund: Math.max(0, total - fee), escrow: (fee > 0 ? "partial_refund" : "refunded") as Escrow };
  }
  const hold = Math.round((total * settings.logistics_holdback_percent) / 100);
  return {
    fee: hold,
    refund: Math.max(0, total - hold),
    escrow: (hold > 0 ? "partial_refund" : "refunded") as Escrow,
  };
}

export function isSaturdayLagos(now = new Date()) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", weekday: "short" }).format(now) === "Sat";
}

export function nextSaturdayLabel(now = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = fmt.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const today = map[weekday ?? "Tue"] ?? 2;
  const add = today === 6 ? 0 : (6 - today + 7) % 7;
  return isoDate(add, now);
}

export function carLimit(user: { owner_type: string | null; car_limit_override: number | null }) {
  if (user.car_limit_override != null) return user.car_limit_override;
  return user.owner_type === "company" ? 25 : 3;
}

export function sum(rows: Booking[], key: "owner_amount" | "driver_amount" | "platform_fee" | "total_amount") {
  return rows.reduce((a, b) => a + b[key], 0);
}

export function wallet(rows: Booking[], key: "owner_amount" | "driver_amount") {
  const available = sum(
    rows.filter((b) => b.escrow_status === "released"),
    key,
  );
  const pending = sum(
    rows.filter((b) => b.escrow_status === "held" || b.escrow_status === "pending_approval"),
    key,
  );
  return { available, pending };
}

export function recomputeRating(reviews: { car_id: string; trip_rating: number }[], carId: string) {
  const mine = reviews.filter((r) => r.car_id === carId);
  if (!mine.length) return null;
  const avg = mine.reduce((a, r) => a + r.trip_rating, 0) / mine.length;
  return Math.round(avg * 10) / 10;
}

export function driverRating(reviews: { driver_id: string | null; driver_rating: number | null }[], driverId: string) {
  const mine = reviews.filter((r) => r.driver_id === driverId && r.driver_rating != null);
  if (!mine.length) return null;
  const avg = mine.reduce((a, r) => a + (r.driver_rating ?? 0), 0) / mine.length;
  return Math.round(avg * 10) / 10;
}

export function landing(role: string) {
  if (role === "owner") return "/owner";
  if (role === "driver") return "/driver";
  if (role === "admin") return "/admin";
  return "/customer";
}

export function statusLabel(status: BookingStatus, admin = false) {
  switch (status) {
    case "pending_payment":
      return admin ? "Pending" : "Pending Payment";
    case "confirmed":
      return admin ? "Upcoming" : "Booking Confirmed";
    case "active":
      return admin ? "Ongoing" : "Trip Active";
    case "overdue":
      return "Overdue";
    case "completed":
      return admin ? "Completed" : "Trip Completed";
    default:
      return "Cancelled";
  }
}

export function escrowLabel(e: Escrow, admin = false) {
  if (e === "held") return admin ? "Held" : "Held in escrow";
  if (e === "pending_approval") return admin ? "Pending approval" : "Awaiting admin approval";
  if (e === "released") return "Released";
  if (e === "partial_refund") return "Partial refund";
  return "Refunded";
}

export function longDate(iso: string) {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

export function monthKey(iso: string) {
  return iso.slice(0, 7);
}
