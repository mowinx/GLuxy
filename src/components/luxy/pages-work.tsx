import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Btn, Card, Empty, ErrorNote, EscrowPill, Field, Money, Note, PageTitle, Pill, Stat, StatusPill, Stub, inputClass } from "@/components/luxy/bits";
import { GridCalendar } from "@/components/luxy/calendar";
import { CarCard, publicCars } from "@/components/luxy/cars";
import { DonutBlock, LineBlock } from "@/components/luxy/charts";
import { COUNTRIES, FUELS, MAKES, NIGERIAN_STATES, PHOTO_ID_TYPES, TRANSMISSIONS, carName } from "@/lib/luxy/catalog";
import {
  billedDays,
  carLimit,
  customerDaily,
  driverRating,
  effectiveStatus,
  isPublicCar,
  isSaturdayLagos,
  longDate,
  naira,
  nextSaturdayLabel,
  suggestRates,
  wallet,
} from "@/lib/luxy/pricing";
import { useLuxy, useLuxyQuery, useUser } from "@/lib/luxy/store";
import type { Booking, BookingStatus, Car, Role } from "@/lib/luxy/types";

function hrefFor(role: Role, b: Booking) {
  return role === "customer" ? `/booking/${b.booking_code}` : `/booking-ref/${b.id}`;
}

function Tabs({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto">
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange(t)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${value === t ? "bg-accent text-card" : "bg-card text-body border border-line"}`}>
          {t}
        </button>
      ))}
    </div>
  );
}

function bucket(status: BookingStatus) {
  if (status === "cancelled_pre_pickup" || status === "cancelled_post_pickup") return "Canceled";
  if (status === "completed") return "Successful";
  return "Pending";
}

export function BookingList({ rows, role, showMoney }: { rows: Booking[]; role: Role; showMoney: boolean }) {
  const cars = useLuxyQuery((s) => s.cars);
  const [tab, setTab] = useState("Pending");
  const shown = rows.filter((b) => bucket(effectiveStatus(b)) === tab);
  return (
    <div>
      <Tabs tabs={["Pending", "Successful", "Canceled"]} value={tab} onChange={setTab} />
      <div className="space-y-2">
        {shown.map((b) => {
          const car = cars.find((c) => c.id === b.car_id);
          return (
            <a key={b.id} href={hrefFor(role, b)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-page px-4 py-3">
              <span>
                <span className="block font-medium">{car?.name}</span>
                <span className="text-xs text-muted">{b.start_date} → {b.end_date}{role === "customer" ? ` · ${b.booking_code}` : ""}</span>
              </span>
              <span className="flex items-center gap-2">
                {showMoney ? <span className="text-sm">{naira(role === "owner" ? b.owner_amount : b.total_amount)}</span> : null}
                <StatusPill status={effectiveStatus(b)} admin={role === "admin"} />
              </span>
            </a>
          );
        })}
        {shown.length === 0 ? <Empty title="Nothing in this tab." /> : null}
      </div>
    </div>
  );
}

export function CustomerHome() {
  const user = useUser();
  const id = user?.id ?? "";
  const bookings = useLuxyQuery((s) => s.bookings.filter((b) => b.customer_id === id));
  const favorites = useLuxyQuery((s) => s.favorites.filter((f) => f.customer_id === id));
  const cars = useLuxyQuery((s) => s.cars);
  if (!user) return <p className="p-6 text-sm text-body">Opening your dashboard…</p>;
  const spent = bookings.filter((b) => b.escrow_status === "released" || b.status === "completed" || b.status === "confirmed" || b.status === "active").reduce((a, b) => a + b.total_amount, 0);
  const upcoming = bookings.find((b) => ["confirmed", "active", "overdue"].includes(effectiveStatus(b)));
  const recommended = publicCars(cars).filter((c) => !bookings.some((b) => b.car_id === c.id && effectiveStatus(b) !== "cancelled_pre_pickup")).slice(0, 3);
  return (
    <div className="space-y-6">
      <PageTitle title="Dashboard" sub="Your trips, in one place." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Upcoming" value={bookings.filter((b) => effectiveStatus(b) === "confirmed").length} />
        <Stat label="Total spent" value={naira(spent)} />
        <Stat label="Favorites" value={favorites.length} />
        <Stat label="Total bookings" value={bookings.length} />
      </div>
      <Card>
        <h2 className="font-semibold">Search</h2>
        <form className="mt-3 grid gap-3 md:grid-cols-4" action="/customer/cars">
          <input name="location" placeholder="City" aria-label="City" className={inputClass} />
          <input name="start" type="date" aria-label="Start" className={inputClass} />
          <input name="end" type="date" aria-label="End" className={inputClass} />
          <Btn type="submit">Browse</Btn>
        </form>
      </Card>
      {upcoming ? (
        <Card>
          <h2 className="font-semibold">Upcoming booking</h2>
          <a className="mt-2 block text-accent" href={hrefFor("customer", upcoming)}>{cars.find((c) => c.id === upcoming.car_id)?.name}</a>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            {["Confirmed", "Pickup", "On trip", "Done"].map((s, i) => (
              <div key={s} className={`rounded-lg py-2 ${i === 0 || (i === 2 && upcoming.status !== "confirmed") ? "bg-tint text-accent" : "bg-page text-muted"}`}>{s}</div>
            ))}
          </div>
        </Card>
      ) : <Empty title="No upcoming trip. Browse a car when you need one." />}
      <div className="grid gap-4 md:grid-cols-3">
        {recommended.map((c) => <CarCard key={c.id} car={c} />)}
      </div>
    </div>
  );
}

export function CustomerCars() {
  const cars = useLuxyQuery((s) => publicCars(s.cars));
  const [q, setQ] = useState("");
  const rows = cars.filter((c) => `${c.name} ${c.location}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageTitle title="Browse cars" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or city" aria-label="Search cars" className={`${inputClass} mb-4 max-w-md`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((c) => <CarCard key={c.id} car={c} />)}</div>
    </div>
  );
}

export function CustomerBookings() {
  const user = useUser()!;
  const rows = useLuxyQuery((s) => s.bookings.filter((b) => b.customer_id === user.id));
  return <div><PageTitle title="My bookings" /><BookingList rows={rows} role="customer" showMoney /></div>;
}

export function CustomerFavorites() {
  const user = useUser()!;
  const fav = useLuxyQuery((s) => s.favorites.filter((f) => f.customer_id === user.id));
  const cars = useLuxyQuery((s) => s.cars);
  const rows = fav.map((f) => cars.find((c) => c.id === f.car_id)).filter((c): c is Car => !!c && isPublicCar(c));
  return <div><PageTitle title="Favorites" />{rows.length ? <div className="grid gap-4 sm:grid-cols-2">{rows.map((c) => <CarCard key={c.id} car={c} />)}</div> : <Empty title="You have not saved a car yet." />}</div>;
}

export function CustomerWallet() {
  const user = useUser()!;
  const rows = useLuxyQuery((s) => s.bookings.filter((b) => b.customer_id === user.id));
  const spent = rows.reduce((a, b) => a + (b.escrow_status === "refunded" || b.escrow_status === "partial_refund" ? b.total_amount - b.refund_amount : b.total_amount), 0);
  return (
    <div className="space-y-4">
      <PageTitle title="Wallet" sub="A stored balance is not available. This is what you have paid." />
      <Stat label="Total spent" value={naira(spent)} />
      <Note>Luxy Wallet top-up is not part of this product.</Note>
      <div className="space-y-2">
        {rows.map((b) => (
          <div key={b.id} className="flex justify-between rounded-lg border border-line bg-card px-4 py-3 text-sm">
            <span>{b.start_date}<span className="block text-xs text-muted">{b.booking_code}</span></span>
            <span>{naira(b.total_amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CustomerReviews() {
  const user = useUser()!;
  const reviews = useLuxyQuery((s) => s.reviews.filter((r) => r.customer_id === user.id));
  const cars = useLuxyQuery((s) => s.cars);
  return (
    <div>
      <PageTitle title="Reviews" />
      {reviews.length === 0 ? <Empty title="Reviews appear after a completed trip." /> : reviews.map((r) => (
        <Card key={r.id} className="mb-3">
          <p className="font-medium">{cars.find((c) => c.id === r.car_id)?.name}</p>
          <p className="text-sm">Trip {r.trip_rating}/5{r.driver_rating ? ` · Driver ${r.driver_rating}/5` : ""}</p>
          {r.review_text ? <p className="mt-1 text-sm text-body">{r.review_text}</p> : null}
        </Card>
      ))}
    </div>
  );
}

export function CustomerSupport() {
  return <div><PageTitle title="Support" /><a className="text-accent" href="mailto:support@luxy.africa">support@luxy.africa</a></div>;
}
export function MessagesStub() { return <Stub title="Messages" copy="In-app chat is not part of Luxy yet." />; }
export function NotificationsStub() { return <Stub title="Notifications" copy="There is no notification centre yet. Nothing here is unread." />; }

export function CustomerSettings() {
  const user = useUser()!;
  const kyc = useLuxyQuery((s) => s.customerKyc[user.id]);
  const save = useLuxyQuery((s) => s.saveCustomerKyc);
  const bio = useLuxyQuery((s) => s.updateBio);
  const [msg, setMsg] = useState("");
  return (
    <form className="max-w-lg space-y-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); bio(String(fd.get("bio"))); save({ nin: String(fd.get("nin")), bvn: String(fd.get("bvn")), submitted_at: null }); setMsg("Saved."); }}>
      <PageTitle title="Settings" sub="NIN or BVN. Documents and selfies come later." />
      <Field label="Bio"><textarea name="bio" defaultValue={user.bio} className={inputClass} maxLength={300} /></Field>
      <Field label="NIN"><input name="nin" defaultValue={kyc?.nin ?? ""} className={inputClass} /></Field>
      <Field label="BVN"><input name="bvn" defaultValue={kyc?.bvn ?? ""} className={inputClass} /></Field>
      {msg ? <Note>{msg}</Note> : null}
      <Btn type="submit">Save</Btn>
    </form>
  );
}

export function OwnerHome() {
  const user = useUser();
  const id = user?.id ?? "";
  const cars = useLuxyQuery((s) => s.cars.filter((c) => c.owner_id === id));
  const bookings = useLuxyQuery((s) => s.bookings.filter((b) => b.owner_id === id));
  const w = wallet(bookings, "owner_amount");
  const rated = cars.filter((c) => c.rating != null);
  const avg = rated.length ? (rated.reduce((a, c) => a + (c.rating ?? 0), 0) / rated.length).toFixed(1) : "—";
  const months = useMemo(() => {
    const map = new Map<string, number>();
    bookings.filter((b) => b.escrow_status === "released").forEach((b) => {
      const k = (b.payment_approved_at ?? b.created_at).slice(0, 7);
      map.set(k, (map.get(k) ?? 0) + b.owner_amount);
    });
    let run = 0;
    return [...map.entries()].sort().map(([name, v]) => { run += v; return { name, value: run }; });
  }, [bookings]);
  const byCar = cars.map((c) => ({ name: c.model, value: bookings.filter((b) => b.car_id === c.id && b.escrow_status === "released").reduce((a, b) => a + b.owner_amount, 0) }));
  const self = cars.find((c) => c.self_driven);
  const startable = bookings.filter((b) => b.status === "confirmed" && self && b.car_id === self.id);
  const done = bookings.filter((b) => !b.status.startsWith("cancelled"));
  const cancelled = bookings.filter((b) => b.status.startsWith("cancelled")).length;
  if (!user) return <p className="p-6 text-sm text-body">Opening your dashboard…</p>;
  return (
    <div className="space-y-6">
      <PageTitle title="Owner" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Earnings released" value={naira(w.available)} />
        <Stat label="Bookings" value={bookings.length} />
        <Stat label="Cars listed" value={cars.length} hint={`Limit ${carLimit(user)}`} />
        <Stat label="Avg rating" value={avg} />
      </div>
      {startable.length ? <Note>You drive {self?.name}. Open the trip and enter the guest's code.</Note> : null}
      <Card><h2 className="mb-2 font-semibold">Earnings</h2><LineBlock data={months.length ? months : [{ name: "—", value: 0 }]} /></Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">My cars</h2>
          <div className="space-y-2">{cars.map((c) => <OwnerCarRow key={c.id} car={c} />)}</div>
        </Card>
        <Card><h2 className="mb-2 font-semibold">By car</h2><DonutBlock data={byCar} /></Card>
      </div>
      <Card>
        <h2 className="font-semibold">Performance</h2>
        <p className="mt-2 text-sm text-body">Booking rate {bookings.length ? Math.round((done.length / bookings.length) * 100) : 0}% · Cancellation {bookings.length ? Math.round((cancelled / bookings.length) * 100) : 0}% · Avg length {done.length ? (done.reduce((a, b) => a + billedDays(b.start_date, b.end_date), 0) / done.length).toFixed(1) : "—"} days</p>
      </Card>
    </div>
  );
}

function OwnerCarRow({ car }: { car: Car }) {
  const label = car.approval_status === "rejected" ? "Rejected" : !isPublicCar(car) ? car.approval_status === "pending" ? "Pending approval" : "Setup" : "Active";
  return (
    <Link to="/owner/cars/$carId" params={{ carId: car.id }} className="flex items-center justify-between rounded-lg bg-page px-3 py-3 text-sm">
      <span>{car.name}</span>
      <Pill tone={label === "Active" ? "ok" : label === "Rejected" ? "danger" : "warn"}>{label}</Pill>
    </Link>
  );
}

export function OwnerCars() {
  const user = useUser()!;
  const cars = useLuxyQuery((s) => s.cars.filter((c) => c.owner_id === user.id));
  return (
    <div>
      <PageTitle title="My cars" extra={<Link to="/owner/cars/new" className="inline-flex min-h-11 items-center rounded-lg bg-accent px-3 text-sm text-card">Add new car</Link>} />
      <div className="grid gap-3">{cars.map((c) => <OwnerCarRow key={c.id} car={c} />)}</div>
    </div>
  );
}

export function OwnerNewCar() {
  const create = useLuxyQuery((s) => s.createCar);
  const [make, setMake] = useState("Mercedes-Benz");
  const [daily, setDaily] = useState(250000);
  const [err, setErr] = useState("");
  const models = MAKES[make] ?? [];
  const sug = suggestRates(daily);
  return (
    <form className="max-w-xl space-y-3" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const id = create({
        make,
        model: String(fd.get("model")),
        year: Number(fd.get("year")),
        category: String(fd.get("category")) as Car["category"],
        daily_rate: Number(fd.get("daily")),
        weekly_rate: Number(fd.get("weekly")),
        monthly_rate: Number(fd.get("monthly")),
        state: String(fd.get("state")),
        country: String(fd.get("country")),
        plate_number: String(fd.get("plate")),
        transmission: String(fd.get("transmission")),
        seats: Number(fd.get("seats")),
        fuel_type: String(fd.get("fuel")),
        description: String(fd.get("description")),
        image_url: String(fd.get("image")),
      });
      if (!id || !id.startsWith("c-")) setErr(id || "Could not create.");
      else window.location.href = `/owner/cars/${id}`;
    }}>
      <PageTitle title="List a car" sub="It stays off the market until Luxy approves it and a driver is assigned." />
      <Field label="Make"><select className={inputClass} value={make} onChange={(e) => setMake(e.target.value)}>{Object.keys(MAKES).map((m) => <option key={m}>{m}</option>)}</select></Field>
      <Field label="Model"><select name="model" className={inputClass}>{models.map((m) => <option key={m}>{m}</option>)}</select></Field>
      <Field label="Year"><input name="year" type="number" min={2010} max={2026} defaultValue={2024} className={inputClass} /></Field>
      <Field label="Category"><select name="category" className={inputClass}>{["SUV", "Sedan", "Coupe", "Van", "Luxury", "Sports"].map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Transmission"><select name="transmission" className={inputClass}>{TRANSMISSIONS.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Seats"><input name="seats" type="number" defaultValue={4} className={inputClass} /></Field>
      <Field label="Fuel"><select name="fuel" className={inputClass}>{FUELS.map((f) => <option key={f}>{f}</option>)}</select></Field>
      <Field label="Plate · private"><input name="plate" required className={inputClass} /></Field>
      <Field label="Country"><select name="country" className={inputClass}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="State"><select name="state" className={inputClass}>{NIGERIAN_STATES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Image URL"><input name="image" className={inputClass} placeholder="https://" /></Field>
      <Field label="Description"><textarea name="description" className={inputClass} /></Field>
      <Field label="Daily rate"><input name="daily" type="number" value={daily} onChange={(e) => setDaily(Number(e.target.value))} className={inputClass} /></Field>
      <Field label="Weekly · suggested"><input name="weekly" type="number" defaultValue={sug.weekly_rate} key={sug.weekly_rate} className={inputClass} /></Field>
      <Field label="Monthly · suggested"><input name="monthly" type="number" defaultValue={sug.monthly_rate} key={sug.monthly_rate} className={inputClass} /></Field>
      <ErrorNote>{err}</ErrorNote>
      <Btn type="submit">Save draft</Btn>
      <p className="text-xs text-muted">Preview name {carName(make, models[0] ?? "", 2024)}</p>
    </form>
  );
}

export function OwnerCarPage({ carId }: { carId: string }) {
  const car = useLuxyQuery((s) => s.cars.find((c) => c.id === carId));
  const user = useUser()!;
  const update = useLuxyQuery((s) => s.updateCar);
  const assign = useLuxyQuery((s) => s.assignDriver);
  const invites = useLuxyQuery((s) => s.invites.filter((i) => i.owner_id === user.id && i.owner_approved_at && i.admin_approved_at && i.accepted_profile_id));
  const users = useLuxyQuery((s) => s.users);
  const bookings = useLuxyQuery((s) => s.bookings.filter((b) => b.car_id === carId));
  const [err, setErr] = useState("");
  if (!car || car.owner_id !== user.id) return <p>Not your car.</p>;
  return (
    <div className="space-y-6">
      <PageTitle title={car.name} sub={`${car.approval_status}${car.rejection_reason ? ` · ${car.rejection_reason}` : ""}`} />
      {!isPublicCar(car) ? <Note>Guests cannot book this car until it is active, approved, and has a driver.</Note> : null}
      <form className="grid max-w-xl gap-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); setErr(update(car.id, {
        description: String(fd.get("description")),
        plate_number: String(fd.get("plate")),
        daily_rate: Number(fd.get("daily")),
        status: String(fd.get("status")) as Car["status"],
        vehicle_licence_number: String(fd.get("vl")),
        insurance_provider: String(fd.get("ins")),
        insurance_policy_number: String(fd.get("pol")),
        insurance_expiry: String(fd.get("ie")),
        roadworthiness_expiry: String(fd.get("rw")),
        vehicle_kyc_submitted_at: new Date().toISOString(),
      }) ?? ""); }}>
        <Field label="Description"><textarea name="description" defaultValue={car.description} className={inputClass} /></Field>
        <Field label="Plate"><input name="plate" defaultValue={car.plate_number} className={inputClass} /></Field>
        <Field label="Your daily rate"><input name="daily" type="number" defaultValue={car.daily_rate} className={inputClass} /></Field>
        <Field label="Listing status"><select name="status" defaultValue={car.status} className={inputClass}><option value="draft">draft</option><option value="active">active</option><option value="inactive">inactive</option></select></Field>
        <Field label="Vehicle licence"><input name="vl" defaultValue={car.vehicle_licence_number} className={inputClass} /></Field>
        <Field label="Insurer"><input name="ins" defaultValue={car.insurance_provider} className={inputClass} /></Field>
        <Field label="Policy"><input name="pol" defaultValue={car.insurance_policy_number} className={inputClass} /></Field>
        <Field label="Insurance expiry"><input name="ie" type="date" defaultValue={car.insurance_expiry} className={inputClass} /></Field>
        <Field label="Roadworthiness expiry"><input name="rw" type="date" defaultValue={car.roadworthiness_expiry} className={inputClass} /></Field>
        <ErrorNote>{err}</ErrorNote>
        <Btn type="submit">Save</Btn>
      </form>
      <Card>
        <h2 className="font-semibold">Driver</h2>
        <p className="mt-1 text-sm text-muted">A person can drive only one of your cars. Moving them frees the previous car.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn variant="secondary" onClick={() => setErr(assign(car.id, "self") ?? "")}>Drive it myself</Btn>
          <Btn variant="ghost" onClick={() => setErr(assign(car.id, "none") ?? "")}>Remove driver</Btn>
          {invites.map((i) => (
            <Btn key={i.id} variant="secondary" onClick={() => setErr(assign(car.id, i.accepted_profile_id!) ?? "")}>
              {users.find((u) => u.id === i.accepted_profile_id)?.full_name}
            </Btn>
          ))}
        </div>
        <ErrorNote>{err}</ErrorNote>
      </Card>
      <BookingList rows={bookings} role="owner" showMoney />
    </div>
  );
}

export function OwnerBookings() {
  const user = useUser()!;
  const rows = useLuxyQuery((s) => s.bookings.filter((b) => b.owner_id === user.id));
  return <div><PageTitle title="Bookings" /><BookingList rows={rows} role="owner" showMoney /></div>;
}

export function CalendarPage({ role }: { role: "owner" | "driver" }) {
  const user = useUser()!;
  const bookings = useLuxyQuery((s) => s.bookings.filter((b) => (role === "owner" ? b.owner_id === user.id : b.driver_id === user.id)));
  const [day, setDay] = useState<string | null>(null);
  const marks: Record<string, number> = {};
  bookings.forEach((b) => {
    if (!["confirmed", "active", "overdue"].includes(effectiveStatus(b))) return;
    const d = new Date(b.start_date + "T12:00:00");
    const end = new Date(b.end_date + "T12:00:00");
    while (d <= end) {
      const k = d.toISOString().slice(0, 10);
      marks[k] = (marks[k] ?? 0) + 1;
      d.setDate(d.getDate() + 1);
    }
  });
  const dayRows = bookings.filter((b) => day && day >= b.start_date && day <= b.end_date && ["confirmed", "active", "overdue"].includes(effectiveStatus(b)));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div><PageTitle title="Calendar" /><GridCalendar marks={marks} onPick={setDay} /></div>
      <Card>
        <h2 className="font-semibold">{day ? longDate(day) : "Pick a day"}</h2>
        {day && dayRows.length === 0 ? <p className="mt-2 text-sm text-body">No booking for this day.</p> : null}
        <div className="mt-3 space-y-2">{dayRows.map((b) => <a key={b.id} className="block text-sm text-accent" href={hrefFor(role, b)}>{b.start_date} · {effectiveStatus(b)}</a>)}</div>
      </Card>
    </div>
  );
}

export function OwnerWallet() {
  const user = useUser()!;
  const rows = useLuxyQuery((s) => s.bookings.filter((b) => b.owner_id === user.id));
  const w = wallet(rows, "owner_amount");
  return (
    <div className="space-y-4">
      <PageTitle title="Wallet" />
      <div className="grid gap-3 sm:grid-cols-2"><Stat label="Available" value={naira(w.available)} /><Stat label="Pending escrow" value={naira(w.pending)} hint="Needs an admin approval before it is yours." /></div>
      <Btn disabled>Withdraw · coming soon</Btn>
      {rows.map((b) => <div key={b.id} className="flex justify-between text-sm"><span>{b.start_date}</span><span className="flex gap-2"><Money value={b.owner_amount} /><EscrowPill status={b.escrow_status} /></span></div>)}
    </div>
  );
}

export function OwnerDrivers() {
  const user = useUser()!;
  const invites = useLuxyQuery((s) => s.invites.filter((i) => i.owner_id === user.id));
  const kyc = useLuxyQuery((s) => s.driverKyc);
  const invite = useLuxyQuery((s) => s.inviteDriver);
  const approve = useLuxyQuery((s) => s.ownerApproveDriver);
  const [link, setLink] = useState("");
  const [err, setErr] = useState("");
  return (
    <div className="space-y-4">
      <PageTitle title="Drivers" />
      <form className="grid max-w-md gap-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const id = invite(String(fd.get("name")), String(fd.get("phone"))); if (!id?.startsWith("inv-")) setErr(id || "Could not invite."); else { setLink(`${window.location.origin}/invite/${id}`); setErr(""); } }}>
        <Field label="Name"><input name="name" className={inputClass} required /></Field>
        <Field label="Phone"><input name="phone" className={inputClass} required /></Field>
        <Btn type="submit">Create invite</Btn>
        {link ? <Note>{link}</Note> : null}
        <ErrorNote>{err}</ErrorNote>
      </form>
      {invites.map((i) => (
        <Card key={i.id}>
          <p className="font-medium">{i.full_name}</p>
          <p className="text-sm text-muted">{i.phone} · {i.admin_approved_at ? "Active" : i.owner_approved_at ? "Waiting on Luxy" : i.accepted_profile_id ? "Waiting on you" : "Invite pending"}</p>
          {i.accepted_profile_id && kyc[i.accepted_profile_id] ? <p className="mt-2 text-xs text-body">Licence {kyc[i.accepted_profile_id].licence_number} · {kyc[i.accepted_profile_id].bank_name}</p> : null}
          <p className="mt-1 text-xs text-muted">/invite/{i.id}</p>
          {i.accepted_profile_id && !i.owner_approved_at ? <Btn className="mt-3" onClick={() => setErr(approve(i.id) ?? "")}>Accept driver</Btn> : null}
        </Card>
      ))}
    </div>
  );
}

export function OwnerEarnings() {
  const user = useUser()!;
  const rows = useLuxyQuery((s) => s.bookings.filter((b) => b.owner_id === user.id && b.escrow_status === "released"));
  return <div><PageTitle title="Earnings" sub="Only money Luxy has released." /><Stat label="Released" value={naira(rows.reduce((a, b) => a + b.owner_amount, 0))} /></div>;
}

export function OwnerReviews() {
  const user = useUser()!;
  const cars = useLuxyQuery((s) => s.cars.filter((c) => c.owner_id === user.id).map((c) => c.id));
  const reviews = useLuxyQuery((s) => s.reviews.filter((r) => cars.includes(r.car_id)));
  return <div><PageTitle title="Reviews" />{reviews.length === 0 ? <Empty title="No guest reviews yet." /> : reviews.map((r) => <Card key={r.id}><p>{r.trip_rating}/5</p><p className="text-sm text-body">{r.review_text}</p></Card>)}</div>;
}

export function OwnerSettings() {
  const user = useUser()!;
  const kyc = useLuxyQuery((s) => s.ownerKyc[user.id]);
  const save = useLuxyQuery((s) => s.saveOwnerKyc);
  const bio = useLuxyQuery((s) => s.updateBio);
  return (
    <form className="max-w-lg space-y-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); bio(String(fd.get("bio"))); save({ nin: String(fd.get("nin")), bvn: String(fd.get("bvn")), photo_id_type: String(fd.get("idt")), photo_id_number: String(fd.get("idn")), address: String(fd.get("address")), bank_name: String(fd.get("bank")), bank_account_name: String(fd.get("an")), bank_account_number: String(fd.get("ac")), company_name: String(fd.get("co") || ""), cac_number: String(fd.get("cac") || ""), tin: String(fd.get("tin") || ""), director_name: String(fd.get("dn") || ""), director_id: String(fd.get("di") || ""), director_bvn: String(fd.get("db") || ""), board_resolution_ref: String(fd.get("br") || ""), submitted_at: null }); }}>
      <PageTitle title="Settings" sub={`${user.owner_type} owner · limit ${carLimit(user)}`} />
      <Field label="Bio"><textarea name="bio" defaultValue={user.bio} className={inputClass} /></Field>
      <Field label="NIN"><input name="nin" defaultValue={kyc?.nin} className={inputClass} /></Field>
      <Field label="BVN"><input name="bvn" defaultValue={kyc?.bvn} className={inputClass} /></Field>
      <Field label="Photo ID type"><select name="idt" defaultValue={kyc?.photo_id_type} className={inputClass}>{PHOTO_ID_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Photo ID number"><input name="idn" defaultValue={kyc?.photo_id_number} className={inputClass} /></Field>
      <Field label="Address"><input name="address" defaultValue={kyc?.address} className={inputClass} /></Field>
      <Field label="Bank"><input name="bank" defaultValue={kyc?.bank_name} className={inputClass} /></Field>
      <Field label="Account name"><input name="an" defaultValue={kyc?.bank_account_name} className={inputClass} /></Field>
      <Field label="Account number"><input name="ac" defaultValue={kyc?.bank_account_number} className={inputClass} /></Field>
      {user.owner_type === "company" ? (
        <>
          <Field label="Company"><input name="co" defaultValue={kyc?.company_name} className={inputClass} /></Field>
          <Field label="CAC"><input name="cac" defaultValue={kyc?.cac_number} className={inputClass} /></Field>
          <Field label="TIN"><input name="tin" defaultValue={kyc?.tin} className={inputClass} /></Field>
          <Field label="Director"><input name="dn" defaultValue={kyc?.director_name} className={inputClass} /></Field>
          <Field label="Director ID"><input name="di" defaultValue={kyc?.director_id} className={inputClass} /></Field>
          <Field label="Director BVN"><input name="db" defaultValue={kyc?.director_bvn} className={inputClass} /></Field>
          <Field label="Board resolution ref"><input name="br" defaultValue={kyc?.board_resolution_ref} className={inputClass} /></Field>
        </>
      ) : null}
      <Btn type="submit">Save KYC</Btn>
    </form>
  );
}

export function DriverHome() {
  const user = useUser();
  const id = user?.id ?? "";
  const bookings = useLuxyQuery((s) => s.bookings.filter((b) => b.driver_id === id));
  const cars = useLuxyQuery((s) => s.cars);
  const reviews = useLuxyQuery((s) => s.reviews);
  const rating = driverRating(reviews, id);
  const today = new Date().toISOString().slice(0, 10);
  if (!user) return <p className="p-6 text-sm text-body">Opening your dashboard…</p>;
  const todays = bookings.filter((b) => today >= b.start_date && today <= b.end_date && !b.status.startsWith("cancelled"));
  const next = bookings.find((b) => b.status === "confirmed");
  const done = bookings.filter((b) => b.status === "completed").length;
  const cancelled = bookings.filter((b) => b.status.startsWith("cancelled")).length;
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const start = useLuxyQuery((s) => s.startTrip);
  return (
    <div className="space-y-4">
      <PageTitle title="Today" />
      <div className="grid gap-3 sm:grid-cols-2"><Stat label="Today's trips" value={todays.length} /><Stat label="Average rating" value={rating == null ? "—" : rating.toFixed(1)} /></div>
      {next ? <Card><h2 className="font-semibold">Next booking</h2><p className="text-sm">{cars.find((c) => c.id === next.car_id)?.name}</p><a className="text-sm text-accent" href={hrefFor("driver", next)}>View details</a></Card> : <Empty title="No pickup is waiting." />}
      <Card>
        <h2 className="font-semibold">Start a trip</h2>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); if (!next) { setErr("No confirmed trip."); return; } setErr(start(next.id, code) ?? "Trip started."); }}>
          <input aria-label="Booking code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Code from the guest" className={inputClass} />
          <Btn type="submit">Start</Btn>
        </form>
        <ErrorNote>{err}</ErrorNote>
      </Card>
      <p className="text-sm text-body">Completion {bookings.length ? Math.round((done / bookings.length) * 100) : 0}% · Cancellation {bookings.length ? Math.round((cancelled / bookings.length) * 100) : 0}% · Trips {bookings.length}</p>
    </div>
  );
}

export function DriverTrips() {
  const user = useUser()!;
  const rows = useLuxyQuery((s) => s.bookings.filter((b) => b.driver_id === user.id));
  const [tab, setTab] = useState("Pending Pickup");
  const cars = useLuxyQuery((s) => s.cars);
  const shown = rows.filter((b) => {
    const s = effectiveStatus(b);
    if (tab === "Pending Pickup") return s === "confirmed";
    if (tab === "Active") return s === "active" || s === "overdue";
    return s === "completed" || s.startsWith("cancelled");
  });
  return (
    <div>
      <PageTitle title="My trips" sub="Amounts are not shown here." />
      <Tabs tabs={["Pending Pickup", "Active", "History"]} value={tab} onChange={setTab} />
      {shown.map((b) => <a key={b.id} href={hrefFor("driver", b)} className="mb-2 flex justify-between rounded-lg bg-page px-4 py-3 text-sm"><span>{cars.find((c) => c.id === b.car_id)?.name}<span className="block text-xs text-muted">{b.pickup_location}</span></span><StatusPill status={effectiveStatus(b)} /></a>)}
      {shown.length === 0 ? <Empty title="Nothing in this tab." /> : null}
    </div>
  );
}

export function DriverVehicles() {
  const user = useUser()!;
  const cars = useLuxyQuery((s) => s.cars.filter((c) => c.driver_id === user.id));
  const users = useLuxyQuery((s) => s.users);
  return (
    <div className="space-y-3">
      <PageTitle title="Vehicles" />
      {cars.length === 0 ? <Empty title="No car is assigned to you." /> : cars.map((c) => {
        const owner = users.find((u) => u.id === c.owner_id);
        return <Card key={c.id}><h2 className="font-semibold">{c.name}</h2><p className="text-sm">Plate {c.plate_number}</p><p className="text-sm text-body">{c.location}</p><p className="text-sm">Owner {owner?.full_name} · {owner?.phone}</p></Card>;
      })}
    </div>
  );
}

export function DriverWallet() {
  const user = useUser()!;
  const rows = useLuxyQuery((s) => s.bookings.filter((b) => b.driver_id === user.id));
  const payouts = useLuxyQuery((s) => s.payouts.filter((p) => p.driver_id === user.id));
  const request = useLuxyQuery((s) => s.requestPayout);
  const [err, setErr] = useState("");
  const w = wallet(rows, "driver_amount");
  const openSat = isSaturdayLagos();
  return (
    <div className="space-y-4">
      <PageTitle title="Wallet" sub="Luxy pays your fee. Owner arrangements are separate." />
      <div className="grid gap-3 sm:grid-cols-2"><Stat label="Available" value={naira(w.available)} /><Stat label="Pending" value={naira(w.pending)} /></div>
      <Btn disabled={!openSat} onClick={() => setErr(request() ?? "Requested.")}>Request payout</Btn>
      {!openSat ? <p className="text-sm text-muted">Opens Saturday {nextSaturdayLabel()} at 00:00, Africa/Lagos, and only after admin has released the trips.</p> : null}
      <ErrorNote>{err}</ErrorNote>
      {payouts.map((p) => <p key={p.id} className="text-sm">{naira(p.amount)} · {p.status}{p.reference ? ` · ${p.reference}` : ""}</p>)}
    </div>
  );
}

export function DriverReviews() {
  const user = useUser()!;
  const reviews = useLuxyQuery((s) => s.reviews.filter((r) => r.driver_id === user.id && r.driver_rating != null));
  return <div><PageTitle title="Ratings" />{reviews.length === 0 ? <Empty title="No driver ratings yet." /> : reviews.map((r) => <Card key={r.id}><p>{r.driver_rating}/5</p><p className="text-sm">{r.review_text}</p></Card>)}</div>;
}

export function DriverSettings() {
  const user = useUser()!;
  const kyc = useLuxyQuery((s) => s.driverKyc[user.id]);
  const save = useLuxyQuery((s) => s.saveDriverKyc);
  const bio = useLuxyQuery((s) => s.updateBio);
  return (
    <form className="max-w-lg space-y-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); bio(String(fd.get("bio"))); save({ nin: String(fd.get("nin")), bvn: String(fd.get("bvn")), licence_number: String(fd.get("lic")), licence_expiry: String(fd.get("lex")), photo_id_type: String(fd.get("idt")), photo_id_number: String(fd.get("idn")), address: String(fd.get("address")), guarantor_name: String(fd.get("gn")), guarantor_id: String(fd.get("gi")), guarantor_phone: String(fd.get("gp")), bank_name: String(fd.get("bank")), bank_account_name: String(fd.get("an")), bank_account_number: String(fd.get("ac")), submitted_at: null }); }}>
      <PageTitle title="Settings" />
      <Field label="Bio"><textarea name="bio" defaultValue={user.bio} className={inputClass} /></Field>
      {[["nin","NIN",kyc?.nin],["bvn","BVN",kyc?.bvn],["lic","Licence",kyc?.licence_number],["idn","Photo ID number",kyc?.photo_id_number],["address","Address",kyc?.address],["gn","Guarantor",kyc?.guarantor_name],["gi","Guarantor ID",kyc?.guarantor_id],["gp","Guarantor phone",kyc?.guarantor_phone],["bank","Bank",kyc?.bank_name],["an","Account name",kyc?.bank_account_name],["ac","Account number",kyc?.bank_account_number]].map(([name, label, val]) => (
        <Field key={name} label={label!}><input name={name} defaultValue={val} className={inputClass} /></Field>
      ))}
      <Field label="Licence expiry"><input name="lex" type="date" defaultValue={kyc?.licence_expiry} className={inputClass} /></Field>
      <Field label="Photo ID type"><select name="idt" defaultValue={kyc?.photo_id_type} className={inputClass}>{PHOTO_ID_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Btn type="submit">Submit KYC</Btn>
    </form>
  );
}

export function priceHint(car: Car) {
  const settings = useLuxy.getState().settings;
  return naira(customerDaily(car, settings));
}
