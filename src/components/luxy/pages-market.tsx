import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Btn, ErrorNote, Field, Note, inputClass } from "@/components/luxy/bits";
import { AvailabilityCalendar } from "@/components/luxy/calendar";
import { CarCard, publicCars } from "@/components/luxy/cars";
import { StoreShell } from "@/components/luxy/shell";
import { CATEGORIES } from "@/lib/luxy/types";
import { customerDaily, customerMonthly, customerWeekly, isPublicCar, landing, perDayLabel, quote, rangeFree } from "@/lib/luxy/pricing";
import { useLuxy, useHydrated, useUser } from "@/lib/luxy/store";

export type HomeSearch = {
  q: string;
  category: string;
  location: string;
  date: string;
  min: string;
  max: string;
  brand: string;
  sort: string;
};

export function parseHome(raw: Record<string, unknown>): HomeSearch {
  const s = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : "");
  return {
    q: s("q"),
    category: s("category") || "All",
    location: s("location"),
    date: s("date"),
    min: s("min"),
    max: s("max"),
    brand: s("brand"),
    sort: s("sort") || "newest",
  };
}

const EMPTY_SEARCH: Record<string, unknown> = {};

export function useRawSearch() {
  return useRouterState({
    select: (s) => {
      const q = s.location.search as unknown;
      return q && typeof q === "object" ? (q as Record<string, unknown>) : EMPTY_SEARCH;
    },
  });
}

export function HomePage() {
  const search = parseHome(useRawSearch());
  const user = useUser();
  const navigate = useNavigate();
  const cars = useLuxy((s) => s.cars);
  const bookings = useLuxy((s) => s.bookings);

  const settings = useLuxy((s) => s.settings);
  const locations = [...new Set(publicCars(cars).map((c) => c.state))].sort();
  const brands = [...new Set(publicCars(cars).map((c) => c.make))].sort();
  const list = useMemo(() => {
    let rows = publicCars(cars);
    const q = search.q.trim().toLowerCase();
    if (q) {
      rows = rows.filter((c) => `${c.name} ${c.make} ${c.model} ${c.location}`.toLowerCase().includes(q));
    }
    if (search.category && search.category !== "All") rows = rows.filter((c) => c.category === search.category);
    if (search.location) rows = rows.filter((c) => c.location.toLowerCase().includes(search.location.toLowerCase()));
    if (search.brand) rows = rows.filter((c) => c.make === search.brand);
    const min = Number(search.min) || 0;
    const max = Number(search.max) || 0;
    if (min) rows = rows.filter((c) => customerDaily(c, settings) >= min);
    if (max) rows = rows.filter((c) => customerDaily(c, settings) <= max);
    if (search.date) rows = rows.filter((c) => rangeFree(bookings, c.id, search.date, search.date));
    if (search.sort === "price_asc") rows = [...rows].sort((a, b) => customerDaily(a, settings) - customerDaily(b, settings));
    else if (search.sort === "price_desc") rows = [...rows].sort((a, b) => customerDaily(b, settings) - customerDaily(a, settings));
    else if (search.sort === "rating") rows = [...rows].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    else rows = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return rows;
  }, [cars, bookings, search, settings]);

  function setSearch(patch: Partial<HomeSearch>) {
    navigate({ to: "/", search: { ...search, ...patch } });
  }

  return (
    <StoreShell>
      <section className="relative z-20 border-b border-line bg-card px-4 py-4 md:px-8">
        <p className="text-sm font-medium text-ink">Open a dashboard</p>
        <p className="mt-1 text-sm text-body">Tap a role. Password for every account is luxy2026.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {[
            ["Customer", "customer"],
            ["Car owner", "owner"],
            ["Driver", "driver"],
            ["Admin", "admin"],
          ].map(([label, role]) => (
            <a
              key={role}
              data-open={role}
              href={`/open/${role}`}
              className="flex min-h-11 items-center justify-center rounded-lg bg-accent px-3 text-sm font-medium text-card"
            >
              {label}
            </a>
          ))}
        </div>
      </section>
      <section className="relative min-h-[70vh] overflow-hidden bg-sidebar text-card">
        <img
          src="https://images.unsplash.com/photo-1631295868223-63265b40d9e4?auto=format&fit=crop&w=2000&q=80"
          alt="A white Rolls-Royce on a quiet street"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/85 to-sidebar/55" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-end px-4 py-16 md:px-8">
          <p className="text-xs tracking-[0.22em] text-tint uppercase">Nigeria · with a driver</p>
          <h1 className="mt-3 max-w-xl font-serif text-5xl leading-tight text-card md:text-6xl">Drive the Extraordinary</h1>
          <p className="mt-4 max-w-lg text-base text-card/90">
            Premium cars, a professional driver on every booking, and one price. Your payment stays in escrow until the trip is done.
          </p>
          <a href="#browse" className="mt-6 inline-flex min-h-11 w-fit items-center rounded-lg bg-accent px-4 text-sm font-medium text-card">
            Browse cars
          </a>
        </div>
      </section>
      <section id="browse" className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setSearch({ category: c })}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${search.category === c ? "bg-accent text-card" : "border border-line bg-card text-body"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <form
          className="mt-2 grid gap-3 rounded-xl border border-line bg-card p-4 md:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setSearch({
              q: String(fd.get("q") || ""),
              location: String(fd.get("location") || ""),
              date: String(fd.get("date") || ""),
              min: String(fd.get("min") || ""),
              max: String(fd.get("max") || ""),
              brand: String(fd.get("brand") || ""),
              sort: String(fd.get("sort") || "newest"),
            });
          }}
        >
          <input name="q" defaultValue={search.q} placeholder="Search" aria-label="Search" className={inputClass} />
          <select name="location" defaultValue={search.location} aria-label="Location" className={inputClass}>
            <option value="">Any city</option>
            {locations.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <input name="date" type="date" defaultValue={search.date} aria-label="Date" className={inputClass} />
          <select name="brand" defaultValue={search.brand} aria-label="Brand" className={inputClass}>
            <option value="">Any brand</option>
            {brands.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <select name="sort" defaultValue={search.sort} aria-label="Sort" className={inputClass}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price, low</option>
            <option value="price_desc">Price, high</option>
            <option value="rating">Rating</option>
          </select>
          <Btn type="submit">Filter</Btn>
          <input name="min" defaultValue={search.min} placeholder="Min ₦/day" aria-label="Minimum daily rate" className={inputClass} />
          <input name="max" defaultValue={search.max} placeholder="Max ₦/day" aria-label="Maximum daily rate" className={inputClass} />
        </form>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
        {list.length === 0 ? <p className="mt-8 text-sm text-body">No approved cars match those filters.</p> : null}
      </section>
      <section className="border-t border-line bg-card">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 md:grid-cols-3 md:px-8">
          {[
            ["A driver, always", "You are driven. Every listing needs an approved driver, or the owner drives that one car."],
            ["One number", "The price you see is the price you pay. Fees are not itemised."],
            ["Escrow", "Nothing is released to the owner or driver until an admin approves it."],
          ].map(([t, d]) => (
            <div key={t}>
              <h2 className="font-serif text-2xl">{t}</h2>
              <p className="mt-2 text-sm text-body">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </StoreShell>
  );
}

export function SupportPage() {
  return (
    <StoreShell>
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-serif text-4xl">Support</h1>
        <p className="mt-3 text-body">Write to us. We answer as people, not a chatbot.</p>
        <a className="mt-6 inline-flex min-h-11 items-center text-accent" href="mailto:support@luxy.africa">
          support@luxy.africa
        </a>
      </div>
    </StoreShell>
  );
}

export function CarPage({ id }: { id: string }) {
  const car = useLuxy((s) => s.cars.find((c) => c.id === id));
  const bookings = useLuxy((s) => s.bookings);
  const user = useUser();
  const navigate = useNavigate();
  const settings = useLuxy((s) => s.settings);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  if (!car || !isPublicCar(car)) {
    return (
      <StoreShell>
        <p className="p-8 text-body">This car is not on the market.</p>
      </StoreShell>
    );
  }
  const q = start && end ? quote(car, start, end, settings) : null;
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-line bg-card px-4 py-4">
        <Link to="/" className="text-sm text-accent">Back to marketplace</Link>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <img src={car.image_url} alt={car.name} className="aspect-[16/10] w-full rounded-xl object-cover" />
          <h1 className="mt-5 text-3xl font-semibold">{car.name}</h1>
          <p className="mt-2 text-sm text-muted">{car.location} · {car.category}</p>
          <p className="mt-4 text-body">{car.description}</p>
          <p className="mt-4 text-sm">{car.transmission} · {car.seats} seats · {car.fuel_type}</p>
          <p className="mt-2 text-sm font-medium text-accent">Professional driver included</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <Rate label="Day" value={customerDaily(car, settings)} />
            <Rate label="Week" value={customerWeekly(car, settings)} />
            <Rate label="Month" value={customerMonthly(car, settings)} />
          </div>
        </div>
        <aside className="h-fit rounded-xl border border-line bg-card p-5">
          <h2 className="font-semibold">Dates</h2>
          <div className="mt-3">
            <AvailabilityCalendar carId={car.id} bookings={bookings} start={start} end={end} onChange={(a, b) => { setStart(a); setEnd(b); }} />
          </div>
          {q ? (
            <p className="mt-4 text-lg font-semibold">
              {q.total_amount.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })}
              <span className="mt-1 block text-sm font-normal text-muted">{perDayLabel(q.total_amount, q.days)}</span>
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted">Choose a pickup and return to see the total.</p>
          )}
          <Btn
            className="mt-4 w-full"
            disabled={!q}
            onClick={() => {
              if (!user) {
                navigate({ to: "/login", search: { next: `/booking/summary?carId=${car.id}&start=${start}&end=${end}` } });
                return;
              }
              if (user.role !== "customer") return;
              navigate({ to: "/booking/summary", search: { carId: car.id, start, end } });
            }}
          >
            Continue booking
          </Btn>
          {user && user.role !== "customer" ? <p className="mt-2 text-xs text-muted">Bookings are for customer accounts.</p> : null}
        </aside>
      </div>
    </div>
  );
}

function Rate({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-page p-3">
      <p className="text-xs tracking-widest text-muted uppercase">{label}</p>
      <p className="font-medium">{value.toLocaleString("en-NG")}</p>
    </div>
  );
}

export type BookSearch = { carId: string; start: string; end: string };

export function parseBook(raw: Record<string, unknown>): BookSearch {
  const s = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : "");
  return { carId: s("carId"), start: s("start"), end: s("end") };
}

export function SummaryPage({ search }: { search: BookSearch }) {
  const car = useLuxy((s) => s.cars.find((c) => c.id === search.carId));
  const settings = useLuxy((s) => s.settings);
  const user = useUser();
  const ready = useHydrated();
  const navigate = useNavigate();
  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login", search: { next: `/booking/summary?carId=${search.carId}&start=${search.start}&end=${search.end}` } });
  }, [ready, user, navigate, search]);
  if (!car || !search.start || !search.end) return <p className="p-8">Choose a car and dates first.</p>;
  const q = quote(car, search.start, search.end, settings);
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <p className="text-xs tracking-widest text-muted uppercase">Summary</p>
      <h1 className="mt-2 text-2xl font-semibold">{car.name}</h1>
      <p className="mt-2 text-sm text-body">{search.start} to {search.end}</p>
      <p className="mt-6 text-3xl font-semibold">{q.total_amount.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })}</p>
      <p className="text-sm text-muted">{perDayLabel(q.total_amount, q.days)}</p>
      <ul className="mt-4 flex flex-wrap gap-2 text-xs">
        {["Professional driver", "Fuel included", "Basic insurance", "24/7 support"].map((c) => (
          <li key={c} className="rounded-full bg-tint px-3 py-1 text-accent">{c}</li>
        ))}
      </ul>
      <Btn className="mt-6" onClick={() => navigate({ to: "/booking/details", search })}>Continue</Btn>
    </div>
  );
}

export type DetailSearch = BookSearch & {
  name: string;
  phone: string;
  email: string;
  pickup: string;
  pickupTime: string;
  ret: string;
  retTime: string;
  notes: string;
};

export function parseDetail(raw: Record<string, unknown>): DetailSearch {
  const base = parseBook(raw);
  const s = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : "");
  return {
    ...base,
    name: s("name"),
    phone: s("phone"),
    email: s("email"),
    pickup: s("pickup"),
    pickupTime: s("pickupTime") || "10:00",
    ret: s("ret"),
    retTime: s("retTime") || "16:00",
    notes: s("notes"),
  };
}

export function DetailsPage({ search }: { search: BookSearch }) {
  const user = useUser();
  const car = useLuxy((s) => s.cars.find((c) => c.id === search.carId));
  const navigate = useNavigate();
  const [err, setErr] = useState("");
  if (!user || !car) return <p className="p-8">Sign in as a customer to continue.</p>;
  return (
    <form
      className="mx-auto max-w-xl space-y-4 px-4 py-8"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const notes = String(fd.get("notes") || "");
        if (notes.length > 150) {
          setErr("Keep special requests under 150 characters.");
          return;
        }
        navigate({
          to: "/checkout",
          search: {
            ...search,
            name: String(fd.get("name") || ""),
            phone: String(fd.get("phone") || ""),
            email: String(fd.get("email") || ""),
            pickup: String(fd.get("pickup") || car.location),
            pickupTime: String(fd.get("pickupTime") || "10:00"),
            ret: String(fd.get("ret") || car.location),
            retTime: String(fd.get("retTime") || "16:00"),
            notes,
          },
        });
      }}
    >
      <h1 className="text-2xl font-semibold">Pickup</h1>
      <Field label="Name"><input name="name" required defaultValue={user.full_name} className={inputClass} /></Field>
      <Field label="Phone"><input name="phone" required defaultValue={user.phone} className={inputClass} /></Field>
      <Field label="Email"><input name="email" type="email" required defaultValue={user.email} className={inputClass} /></Field>
      <Field label="Pickup location"><input name="pickup" required defaultValue={car.location} className={inputClass} /></Field>
      <Field label="Pickup time"><input name="pickupTime" type="time" defaultValue="10:00" className={inputClass} /></Field>
      <Field label="Return location"><input name="ret" required defaultValue={car.location} className={inputClass} /></Field>
      <Field label="Return time"><input name="retTime" type="time" defaultValue="16:00" className={inputClass} /></Field>
      <Field label="Special requests"><textarea name="notes" maxLength={150} className={inputClass} /></Field>
      <ErrorNote>{err}</ErrorNote>
      <Btn type="submit">Continue to payment</Btn>
    </form>
  );
}

export function CheckoutPage({ search }: { search: DetailSearch }) {
  const car = useLuxy((s) => s.cars.find((c) => c.id === search.carId));
  const settings = useLuxy((s) => s.settings);
  const confirm = useLuxy((s) => s.confirmBooking);
  const navigate = useNavigate();
  const [err, setErr] = useState("");
  const [method, setMethod] = useState("card");
  if (!car) return <p className="p-8">Car missing.</p>;
  const q = quote(car, search.start, search.end, settings);
  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Payment</h1>
      <p className="text-3xl font-semibold">{q.total_amount.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })}</p>
      <p className="text-sm text-muted">{perDayLabel(q.total_amount, q.days)}</p>
      <fieldset className="space-y-2">
        <legend className="text-xs tracking-widest text-muted uppercase">Method</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" checked={method === "card"} onChange={() => setMethod("card")} /> Card or bank</label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-faint"><input type="radio" disabled /> Luxy Wallet — coming soon</label>
      </fieldset>
      <Note>Paystack is not connected. Confirming here verifies payment and holds the total in escrow. You will not be charged by a bank.</Note>
      <ErrorNote>{err}</ErrorNote>
      <Btn
        className="w-full"
        onClick={() => {
          const res = confirm({
            car_id: car.id,
            customer_id: "",
            owner_id: "",
            driver_id: null,
            start_date: search.start,
            end_date: search.end,
            pickup_location: search.pickup || car.location,
            pickup_time: search.pickupTime,
            return_location: search.ret || car.location,
            return_time: search.retTime,
            special_requests: search.notes,
            contact_name: search.name,
            contact_phone: search.phone,
            contact_email: search.email,
          });
          if ("error" in res) setErr(res.error);
          else navigate({ to: "/booking/$code", params: { code: res.code } });
        }}
      >
        Pay and confirm
      </Btn>
      <p className="text-xs text-muted">Card and bank confirmation is instant in this preview. A live Paystack charge is not connected.</p>
    </div>
  );
}
