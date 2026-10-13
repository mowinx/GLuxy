import { useMemo, useState } from "react";
import { carBookedOn, datesInclusive, isoDate, todayIso } from "@/lib/luxy/pricing";
import type { Booking } from "@/lib/luxy/types";
import { cn } from "@/lib/utils";

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: startPad }, () => null);
  for (let d = 1; d <= days; d++) {
    const dt = new Date(year, month, d, 12);
    cells.push(dt.toISOString().slice(0, 10));
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function AvailabilityCalendar({
  carId,
  bookings,
  start,
  end,
  onChange,
}: {
  carId: string;
  bookings: Booking[];
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const cells = useMemo(() => monthMatrix(cursor.y, cursor.m), [cursor]);
  const today = todayIso();
  const label = new Date(cursor.y, cursor.m, 1).toLocaleString("en-NG", { month: "long", year: "numeric" });

  function pick(day: string) {
    if (day < today) return;
    if (carBookedOn(bookings, carId, day)) return;
    if (!start || (start && end) || day < start) {
      onChange(day, "");
      return;
    }
    const span = datesInclusive(start, day);
    if (span.some((d) => carBookedOn(bookings, carId, d))) return;
    onChange(start, day);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className="min-h-11 px-2 text-sm text-body" onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}>
          Prev
        </button>
        <p className="text-sm font-medium">{label}</p>
        <button type="button" className="min-h-11 px-2 text-sm text-body" onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}>
          Next
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const past = day < today;
          const booked = carBookedOn(bookings, carId, day);
          const selected = day === start || day === end || (start && end && day > start && day < end);
          return (
            <button
              key={day}
              type="button"
              disabled={past || booked}
              onClick={() => pick(day)}
              className={cn(
                "min-h-11 rounded-lg text-sm",
                past && "text-faint",
                booked && "bg-danger-bg text-danger",
                selected && "bg-accent text-card",
                !past && !booked && !selected && "hover:bg-tint",
              )}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">Green is open. Red is booked. Grey is past. Tap a start day, then a return day.</p>
    </div>
  );
}

export function GridCalendar({
  marks,
  onPick,
}: {
  marks: Record<string, number>;
  onPick: (day: string) => void;
}) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const cells = monthMatrix(cursor.y, cursor.m);
  const label = new Date(cursor.y, cursor.m, 1).toLocaleString("en-NG", { month: "long", year: "numeric" });
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className="min-h-11 px-2 text-sm" onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}>Prev</button>
        <p className="font-medium">{label}</p>
        <button type="button" className="min-h-11 px-2 text-sm" onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}>Next</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d}>{d}</div>
        ))}
        {cells.map((day, i) =>
          day ? (
            <button key={day} type="button" onClick={() => onPick(day)} className="relative min-h-11 rounded-lg text-sm text-ink hover:bg-page">
              {Number(day.slice(8))}
              {marks[day] ? <span className="absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-warn" /> : null}
            </button>
          ) : (
            <div key={i} />
          ),
        )}
      </div>
    </div>
  );
}

export function dayOffsetLabel(day: string) {
  return isoDate(0) === day ? "Today" : day;
}
