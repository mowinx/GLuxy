import { useState } from "react";
import { Btn, ErrorNote, EscrowPill, Field, Note, Pill, StatusPill, inputClass } from "@/components/luxy/bits";
import { effectiveStatus, longDate, naira, perDayLabel } from "@/lib/luxy/pricing";
import { useLuxy, useUser } from "@/lib/luxy/store";
import type { Booking, Car, Profile } from "@/lib/luxy/types";

export function TripView({
  booking,
  showCode,
  showCustomerActions,
  showMoney,
}: {
  booking: Booking;
  showCode: boolean;
  showCustomerActions: boolean;
  showMoney: boolean;
}) {
  const cars = useLuxy((s) => s.cars);
  const users = useLuxy((s) => s.users);
  const user = useUser();
  const startTrip = useLuxy((s) => s.startTrip);
  const requestCode = useLuxy((s) => s.requestCode);
  const endTrip = useLuxy((s) => s.endTrip);
  const cancel = useLuxy((s) => s.cancelPrePickup);
  const extend = useLuxy((s) => s.extendBooking);
  const report = useLuxy((s) => s.reportIssue);
  const addReview = useLuxy((s) => s.addReview);
  const reviews = useLuxy((s) => s.reviews);
  const car = cars.find((c) => c.id === booking.car_id);
  const driver = users.find((u) => u.id === (booking.driver_id ?? (car?.self_driven ? car.owner_id : "")));
  const customer = users.find((u) => u.id === booking.customer_id);
  const status = effectiveStatus(booking);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [issue, setIssue] = useState("");
  const [extra, setExtra] = useState(1);
  const [stars, setStars] = useState(5);
  const [driverStars, setDriverStars] = useState(5);
  const [text, setText] = useState("");
  const reviewed = reviews.some((r) => r.booking_id === booking.id);
  const canDrive =
    !!user &&
    (user.role === "admin" ||
      (user.role === "driver" && booking.driver_id === user.id) ||
      (user.role === "owner" && car?.self_driven && car.owner_id === user.id));
  const endReady = !!booking.scheduled_end_at && Date.now() >= new Date(booking.scheduled_end_at).getTime();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={status} admin={user?.role === "admin"} />
        {user?.role === "admin" || showMoney ? <EscrowPill status={booking.escrow_status} admin={user?.role === "admin"} /> : null}
      </div>
      <h1 className="text-2xl font-semibold">{car?.name ?? "Booking"}</h1>
      <p className="text-sm text-body">
        {longDate(booking.start_date)} → {longDate(booking.end_date)}
      </p>
      {showCode && status === "confirmed" ? (
        <div className="rounded-xl border border-line bg-card p-5">
          <p className="text-xs tracking-widest text-muted uppercase">Booking code</p>
          <p className="mt-2 font-serif text-3xl tracking-widest">{booking.booking_code}</p>
          <p className="mt-2 text-sm text-body">Give this to your driver at pickup. It is not shown to them in the app.</p>
        </div>
      ) : null}
      {user?.role === "admin" ? (
        <Note>Code for operations: {booking.booking_code}</Note>
      ) : null}
      <ol className="grid gap-2 sm:grid-cols-3">
        <Step on={!!booking.created_at} label="Confirmed" when={booking.created_at} />
        <Step on={!!booking.activated_at} label="Active" when={booking.activated_at} />
        <Step on={!!booking.trip_ended_at || status.startsWith("cancelled")} label={status.startsWith("cancelled") ? "Cancelled" : "Completed"} when={booking.trip_ended_at ?? booking.cancelled_at} />
      </ol>
      {driver ? <Person title={car?.self_driven ? "Owner driving" : "Driver"} person={driver} /> : null}
      {user?.role !== "customer" && customer ? <Person title="Guest" person={customer} /> : null}
      {status === "overdue" ? <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">This trip is past its booked end and has not been closed.</p> : null}
      <div className="rounded-xl border border-line bg-card p-5 text-sm">
        <p>{booking.pickup_location} · {booking.pickup_time}</p>
        <p className="mt-1 text-muted">Return {booking.return_location} · {booking.return_time}</p>
        {showMoney ? (
          <p className="mt-3 font-semibold">
            {naira(booking.total_amount)} <span className="font-normal text-muted">· {perDayLabel(booking.total_amount, Math.max(1, days(booking)))}</span>
          </p>
        ) : null}
        {user?.role === "admin" ? (
          <p className="mt-2 text-muted">
            Owner {naira(booking.owner_amount)} · Driver {naira(booking.driver_amount)} · Luxy {naira(booking.platform_fee)}
          </p>
        ) : null}
        {(user?.role === "customer" || user?.role === "owner" || user?.role === "admin" || user?.role === "driver") && car ? (
          <p className="mt-2">Plate {showPlate(user.role, booking, car, user.id) ? car.plate_number : "hidden until the people who need it"}</p>
        ) : null}
        {booking.special_requests ? <p className="mt-2 text-body">Note: {booking.special_requests}</p> : null}
      </div>
      <ErrorNote>{msg}</ErrorNote>
      {canDrive && status === "confirmed" ? (
        <form
          className="space-y-3 rounded-xl border border-line bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(startTrip(booking.id, code));
          }}
        >
          <Field label="Start trip">
            <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="LUXY-XXXXXX" aria-label="Booking code" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Btn type="submit">Start trip</Btn>
            {user?.role === "driver" ? (
              <Btn variant="secondary" onClick={() => setMsg(requestCode(booking.id))}>Request booking code</Btn>
            ) : null}
          </div>
        </form>
      ) : null}
      {canDrive && (status === "active" || status === "overdue") ? (
        <div className="space-y-2">
          <Btn variant="success" disabled={!endReady} onClick={() => setMsg(endTrip(booking.id))}>End trip</Btn>
          {!endReady ? <p className="text-xs text-muted">End Trip unlocks after the booked return time.</p> : null}
        </div>
      ) : null}
      {showCustomerActions && status === "confirmed" ? (
        <Btn variant="secondary" onClick={() => setMsg(cancel(booking.id))}>Cancel before pickup</Btn>
      ) : null}
      {showCustomerActions && (status === "active" || status === "overdue") ? (
        <div className="space-y-3 rounded-xl border border-line bg-card p-5">
          <Field label="Extend by days">
            <input className={inputClass} type="number" min={1} value={extra} onChange={(e) => setExtra(Number(e.target.value))} />
          </Field>
          <Btn onClick={() => setMsg(extend(booking.id, extra))}>Pay extension and extend</Btn>
          <Field label="Report an issue">
            <textarea className={inputClass} value={issue} onChange={(e) => setIssue(e.target.value)} />
          </Field>
          <Btn variant="secondary" onClick={() => setMsg(report(booking.id, issue))}>Send to Luxy</Btn>
          <p className="text-xs text-muted">Live location tracking isn't available yet — use Call or Message above.</p>
        </div>
      ) : null}
      {showCustomerActions && status === "completed" && !reviewed ? (
        <form
          className="space-y-3 rounded-xl border border-line bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(addReview(booking.id, stars, booking.driver_id ? driverStars : null, text));
          }}
        >
          <Field label="Trip rating">
            <StarPick value={stars} onChange={setStars} />
          </Field>
          {booking.driver_id ? (
            <Field label="Driver rating">
              <StarPick value={driverStars} onChange={setDriverStars} />
            </Field>
          ) : null}
          <Field label="Note, optional">
            <textarea className={inputClass} maxLength={200} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <Btn type="submit">Submit review</Btn>
        </form>
      ) : null}
      {reviewed ? <Pill tone="ok">Review saved</Pill> : null}
    </div>
  );
}

function showPlate(role: string, booking: Booking, car: Car, userId: string) {
  if (role === "admin") return true;
  if (role === "owner" && car.owner_id === userId) return true;
  if (role === "driver" && (booking.driver_id === userId || car.driver_id === userId)) return true;
  if (role === "customer" && booking.customer_id === userId) return true;
  return false;
}

function days(b: Booking) {
  return Math.max(1, Math.round((Date.parse(b.end_date) - Date.parse(b.start_date)) / 86400000));
}

function Step({ on, label, when }: { on: boolean; label: string; when: string | null }) {
  return (
    <li className="rounded-xl border border-line bg-card p-3">
      <p className="text-xs tracking-widest text-muted uppercase">{label}</p>
      <p className="mt-1 text-sm">{on && when ? new Date(when).toLocaleString("en-NG") : "Not yet"}</p>
    </li>
  );
}

function Person({ title, person }: { title: string; person: Profile }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 text-sm">
      <p className="text-xs tracking-widest text-muted uppercase">{title}</p>
      <p className="mt-1 font-medium">{person.full_name}</p>
      <p className="text-body">{person.phone}</p>
      <p className="mt-2 flex gap-3">
        <a className="text-accent" href={`tel:${person.phone}`}>Call</a>
        <a className="text-accent" href={`sms:${person.phone}`}>Message</a>
      </p>
    </div>
  );
}

function StarPick({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-label={`${n} stars`} className={`min-h-11 min-w-11 rounded-lg ${n <= value ? "bg-warn-bg text-warn" : "bg-page text-faint"}`} onClick={() => onChange(n)}>
          {n}
        </button>
      ))}
    </div>
  );
}
