import { useState } from "react";
import { Btn, Card, Empty, ErrorNote, Field, PageTitle, Pill, Stat, StatusPill, Stub, inputClass } from "@/components/luxy/bits";
import { DonutBlock, LineBlock } from "@/components/luxy/charts";
import { billedDays, effectiveStatus, isPublicCar, naira, wallet } from "@/lib/luxy/pricing";
import { useLuxy } from "@/lib/luxy/store";
import type { Role } from "@/lib/luxy/types";

const KINDS: Record<string, Role> = { customers: "customer", owners: "owner", drivers: "driver", admins: "admin" };

export function AdminHome() {
  const bookings = useLuxy((s) => s.bookings);
  const users = useLuxy((s) => s.users);
  const cars = useLuxy((s) => s.cars);
  const released = bookings.filter((b) => b.escrow_status === "released");
  const revenue = released.reduce((a, b) => a + b.platform_fee, 0);
  const active = bookings.filter((b) => ["active", "overdue"].includes(effectiveStatus(b))).length;
  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const value = released.filter((b) => (b.payment_approved_at ?? "").slice(0, 10) === key).reduce((a, b) => a + b.platform_fee, 0);
    return { name: key.slice(5), value };
  });
  const donut = [
    { name: "Completed", value: bookings.filter((b) => b.status === "completed").length },
    { name: "Upcoming", value: bookings.filter((b) => effectiveStatus(b) === "confirmed").length },
    { name: "Cancelled", value: bookings.filter((b) => b.status.startsWith("cancelled")).length },
    { name: "Ongoing", value: active },
  ];
  const byCat = new Map<string, number>();
  released.forEach((b) => {
    const car = cars.find((c) => c.id === b.car_id);
    const k = car?.category ?? "Other";
    byCat.set(k, (byCat.get(k) ?? 0) + b.platform_fee);
  });
  return (
    <div className="space-y-6">
      <PageTitle title="Operations" sub="Revenue is platform fee on released bookings only." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue" value={naira(revenue)} />
        <Stat label="Bookings" value={bookings.length} />
        <Stat label="Users" value={users.length} />
        <Stat label="Vehicles" value={cars.length} hint={`${active} active trips`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><h2 className="mb-2 font-semibold">7-day platform fee</h2><LineBlock data={days} /></Card>
        <Card><h2 className="mb-2 font-semibold">Bookings</h2><DonutBlock data={donut} /></Card>
      </div>
      <Card>
        <h2 className="font-semibold">Recent</h2>
        {bookings.slice(0, 6).map((b) => <p key={b.id} className="mt-2 text-sm">{b.booking_code} · {effectiveStatus(b)} · {naira(b.total_amount)}</p>)}
      </Card>
      <p className="text-sm text-body">By category {([...byCat.entries()].map(([k, v]) => `${k} ${naira(v)}`).join(" · ")) || "none released"}</p>
    </div>
  );
}

export function AdminUsers({ kind }: { kind: string }) {
  const role = KINDS[kind] ?? "customer";
  const users = useLuxy((s) => s.users.filter((u) => u.role === role));
  const [id, setId] = useState<string | null>(null);
  const all = useLuxy((s) => s);
  const setLimit = useLuxy((s) => s.setCarLimit);
  const person = users.find((u) => u.id === id);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <PageTitle title={kind} sub={role === "admin" ? "Promote an account in the database in production. This preview has no SQL console." : undefined} />
        {users.map((u) => (
          <button key={u.id} onClick={() => setId(u.id)} className="mb-2 flex w-full items-center justify-between rounded-lg bg-card px-4 py-3 text-left text-sm">
            <span>{u.full_name}<span className="block text-xs text-muted">{u.email} · joined {u.created_at.slice(0, 10)}</span></span>
            <Pill tone="muted">{u.owner_type ?? u.role}</Pill>
          </button>
        ))}
      </div>
      {person ? (
        <Card>
          <h2 className="font-semibold">{person.full_name}</h2>
          <p className="text-sm text-body">{person.bio || "No bio."}</p>
          <p className="mt-2 text-sm">{person.phone}</p>
          {person.role === "customer" ? <p className="mt-2 text-xs">KYC {all.customerKyc[person.id]?.submitted_at ? "submitted" : "not submitted"}</p> : null}
          {person.role === "driver" ? <p className="mt-2 text-xs">Licence {all.driverKyc[person.id]?.licence_number || "not submitted"}</p> : null}
          {person.role === "owner" ? (
            <form className="mt-3" onSubmit={(e) => { e.preventDefault(); const n = Number(new FormData(e.currentTarget).get("limit")); setLimit(person.id, Number.isFinite(n) && n > 0 ? n : null); }}>
              <Field label="Car limit override"><input name="limit" defaultValue={person.car_limit_override ?? ""} className={inputClass} /></Field>
              <Btn type="submit" className="mt-2">Save limit</Btn>
            </form>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

export function AdminVehicles() {
  const cars = useLuxy((s) => s.cars);
  const approve = useLuxy((s) => s.adminApproveCar);
  const reject = useLuxy((s) => s.adminRejectCar);
  const [reason, setReason] = useState("Documents do not match.");
  const [err, setErr] = useState("");
  return (
    <div>
      <PageTitle title="Vehicles" sub="Plate numbers are visible here." />
      <div className="space-y-3">
        {cars.map((c) => (
          <Card key={c.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted">{c.plate_number} · {c.location}</p>
                <p className="text-xs">{c.status} · {c.approval_status}{isPublicCar(c) ? " · on the market" : " · hidden"}</p>
              </div>
              <div className="flex gap-2">
                <Btn onClick={() => setErr(approve(c.id) ?? "")}>Approve</Btn>
                <Btn variant="danger" onClick={() => setErr(reject(c.id, reason) ?? "")}>Reject</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Field label="Rejection reason"><input value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputClass} mt-3`} /></Field>
      <ErrorNote>{err}</ErrorNote>
    </div>
  );
}

export function AdminBookings() {
  const bookings = useLuxy((s) => s.bookings);
  const [id, setId] = useState<string | null>(null);
  const b = bookings.find((x) => x.id === id);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <PageTitle title="Bookings" />
        {bookings.map((row) => (
          <button key={row.id} onClick={() => setId(row.id)} className="mb-2 flex w-full justify-between rounded-lg bg-card px-4 py-3 text-left text-sm">
            <span>{row.booking_code}<span className="block text-xs text-muted">{row.start_date}</span></span>
            <StatusPill status={effectiveStatus(row)} admin />
          </button>
        ))}
      </div>
      {b ? <Card><p className="font-serif text-2xl tracking-widest">{b.booking_code}</p><p className="mt-2 text-sm">Guest total {naira(b.total_amount)}</p><p className="text-sm">Owner {naira(b.owner_amount)} · Driver {naira(b.driver_amount)} · Luxy {naira(b.platform_fee)}</p><a className="mt-3 inline-block text-accent" href={`/booking-ref/${b.id}`}>Open trip</a></Card> : null}
    </div>
  );
}

export function AdminPayments() {
  const bookings = useLuxy((s) => s.bookings);
  const approve = useLuxy((s) => s.approvePayment);
  const payouts = useLuxy((s) => s.payouts);
  const mark = useLuxy((s) => s.markPayoutPaid);
  const [ref, setRef] = useState("");
  const [err, setErr] = useState("");
  const queue = bookings.filter((b) => b.escrow_status === "pending_approval");
  return (
    <div className="space-y-4">
      <PageTitle title="Payments" sub="Nothing moves until you approve it." />
      {queue.length === 0 ? <Empty title="No trips are waiting for release." /> : queue.map((b) => (
        <Card key={b.id}>
          <p className="font-medium">{b.booking_code}</p>
          <p className="text-sm">Owner {naira(b.owner_amount)} · Driver {naira(b.driver_amount)} · Luxy {naira(b.platform_fee)}</p>
          <Btn className="mt-3" onClick={() => setErr(approve(b.id) ?? "Released.")}>Approve payment</Btn>
        </Card>
      ))}
      <h2 className="font-semibold">Driver payout requests</h2>
      {payouts.length === 0 ? <p className="text-sm text-muted">None yet. Drivers can request on Saturdays.</p> : payouts.map((p) => (
        <Card key={p.id}>
          <p>{naira(p.amount)} · {p.status}</p>
          {p.status === "requested" ? <div className="mt-2 flex gap-2"><input aria-label="Transfer reference" value={ref} onChange={(e) => setRef(e.target.value)} className={inputClass} placeholder="Transfer reference" /><Btn onClick={() => setErr(mark(p.id, ref) ?? "")}>Mark paid</Btn></div> : <p className="text-xs">{p.reference}</p>}
        </Card>
      ))}
      <ErrorNote>{err}</ErrorNote>
    </div>
  );
}

export function AdminDisputes() {
  const bookings = useLuxy((s) => s.bookings);
  const support = useLuxy((s) => s.support);
  const end = useLuxy((s) => s.endTrip);
  const cancel = useLuxy((s) => s.adminCancelPost);
  const approveCode = useLuxy((s) => s.approveCodeRequest);
  const resolve = useLuxy((s) => s.resolveSupport);
  const [err, setErr] = useState("");
  const overdue = bookings.filter((b) => effectiveStatus(b) === "overdue");
  const codes = bookings.filter((b) => b.code_requested && b.status === "confirmed");
  return (
    <div className="space-y-4">
      <PageTitle title="Disputes" />
      <h2 className="font-semibold">Code requests</h2>
      {codes.length === 0 ? <p className="text-sm text-muted">No driver is waiting for a code.</p> : codes.map((b) => (
        <Card key={b.id}><p>{b.booking_code}</p><Btn className="mt-2" onClick={() => setErr(approveCode(b.id) ?? "Trip started.")}>Approve and start trip</Btn></Card>
      ))}
      <h2 className="font-semibold">Overdue</h2>
      {overdue.length === 0 ? <Empty title="No overdue trips." /> : overdue.map((b) => (
        <Card key={b.id}>
          <p>{b.booking_code}</p>
          <div className="mt-2 flex gap-2">
            <Btn variant="success" onClick={() => setErr(end(b.id) ?? "")}>Mark returned</Btn>
            <Btn variant="danger" onClick={() => setErr(cancel(b.id, "Holdback on post-pickup cancel") ?? "")}>Cancel with holdback</Btn>
          </div>
        </Card>
      ))}
      <h2 className="font-semibold">Guest reports</h2>
      {support.map((s) => (
        <Card key={s.id}>
          <p className="text-sm">{s.message}</p>
          <Pill tone={s.status === "open" ? "warn" : "ok"}>{s.status}</Pill>
          {s.status === "open" ? <Btn className="mt-2" variant="secondary" onClick={() => resolve(s.id)}>Resolve</Btn> : null}
        </Card>
      ))}
      <ErrorNote>{err}</ErrorNote>
    </div>
  );
}

export function AdminEarnings() {
  const bookings = useLuxy((s) => s.bookings.filter((b) => b.escrow_status === "released"));
  return <div><PageTitle title="Earnings" /><Stat label="Platform fee released" value={naira(bookings.reduce((a, b) => a + b.platform_fee, 0))} /></div>;
}

export function AdminReviews() {
  const reviews = useLuxy((s) => s.reviews);
  return <div><PageTitle title="Reviews" />{reviews.map((r) => <Card key={r.id} className="mb-2"><p>{r.trip_rating}/5 · {r.review_text || "No comment"}</p></Card>)}{reviews.length === 0 ? <Empty title="No reviews." /> : null}</div>;
}

export function AdminReports() {
  const bookings = useLuxy((s) => s.bookings);
  const customers = new Set(bookings.map((b) => b.customer_id));
  const repeats = [...customers].filter((id) => bookings.filter((b) => b.customer_id === id).length > 1).length;
  const cancelled = bookings.filter((b) => b.status.startsWith("cancelled")).length;
  const live = bookings.filter((b) => !b.status.startsWith("cancelled"));
  const avgLen = live.length ? live.reduce((a, b) => a + billedDays(b.start_date, b.end_date), 0) / live.length : 0;
  const avgVal = bookings.length ? bookings.reduce((a, b) => a + b.total_amount, 0) / bookings.length : 0;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <PageTitle title="Reports" />
      <Stat label="Booking rate" value={`${bookings.length ? Math.round((live.length / bookings.length) * 100) : 0}%`} />
      <Stat label="Avg booking value" value={naira(avgVal)} />
      <Stat label="Cancellation rate" value={`${bookings.length ? Math.round((cancelled / bookings.length) * 100) : 0}%`} />
      <Stat label="Repeat customers" value={customers.size ? `${Math.round((repeats / customers.size) * 100)}%` : "—"} />
      <Stat label="Avg trip length" value={`${avgLen.toFixed(1)} days`} />
    </div>
  );
}

export function AdminSettings() {
  const settings = useLuxy((s) => s.settings);
  const update = useLuxy((s) => s.updateSettings);
  const users = useLuxy((s) => s.users);
  const invites = useLuxy((s) => s.invites);
  const approve = useLuxy((s) => s.adminApproveDriver);
  const kyc = useLuxy((s) => s.driverKyc);
  const [err, setErr] = useState("");
  const waiting = invites.filter((i) => i.owner_approved_at && !i.admin_approved_at);
  return (
    <div className="max-w-xl space-y-4">
      <PageTitle title="Platform settings" sub="Fees are flat naira per day. Not a percentage." />
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); update({ platform_fee_per_day: Number(fd.get("p")), driver_fee_per_day: Number(fd.get("d")), cancellation_fee_type: String(fd.get("ct")) as "flat" | "percent", cancellation_fee_value: Number(fd.get("cv")), logistics_holdback_percent: Number(fd.get("h")) }); }}>
        <Field label="Platform fee / day"><input name="p" type="number" defaultValue={settings.platform_fee_per_day} className={inputClass} /></Field>
        <Field label="Driver fee / day"><input name="d" type="number" defaultValue={settings.driver_fee_per_day} className={inputClass} /></Field>
        <Field label="Cancellation fee type"><select name="ct" defaultValue={settings.cancellation_fee_type} className={inputClass}><option value="percent">percent</option><option value="flat">flat</option></select></Field>
        <Field label="Cancellation fee value"><input name="cv" type="number" defaultValue={settings.cancellation_fee_value} className={inputClass} /></Field>
        <Field label="Post-pickup holdback %"><input name="h" type="number" defaultValue={settings.logistics_holdback_percent} className={inputClass} /></Field>
        <Btn type="submit">Save fees</Btn>
      </form>
      <h2 className="font-semibold">KYC grace</h2>
      {users.filter((u) => u.role !== "admin").map((u) => {
        const age = (Date.now() - new Date(u.created_at).getTime()) / 86400000;
        const submitted = u.role === "customer" ? !!useLuxy.getState().customerKyc[u.id]?.submitted_at : u.role === "driver" ? !!kyc[u.id]?.submitted_at : !!useLuxy.getState().ownerKyc[u.id]?.submitted_at;
        if (submitted) return null;
        return <p key={u.id} className="text-sm">{u.full_name} · {age > 30 ? "past 1 month" : age > 23 ? "nearing deadline" : "inside grace"}</p>;
      })}
      <h2 className="font-semibold">Driver stage 2</h2>
      {waiting.length === 0 ? <p className="text-sm text-muted">No driver is waiting on Luxy.</p> : waiting.map((i) => (
        <Card key={i.id}><p>{i.full_name}</p><p className="text-xs">{kyc[i.accepted_profile_id ?? ""]?.licence_number}</p><Btn className="mt-2" onClick={() => setErr(approve(i.id) ?? "")}>Verify and approve</Btn></Card>
      ))}
      <ErrorNote>{err}</ErrorNote>
    </div>
  );
}

export function AdminLocations() {
  const cars = useLuxy((s) => s.cars);
  const states = [...new Set(cars.map((c) => c.state))];
  return <div><PageTitle title="Locations" />{states.map((s) => <Card key={s} className="mb-2"><h2 className="font-medium">{s}</h2><p className="text-sm text-body">{cars.filter((c) => c.state === s).map((c) => c.name).join(", ")}</p></Card>)}</div>;
}

export function AdminSearch() {
  const [q, setQ] = useState("");
  const users = useLuxy((s) => s.users);
  const cars = useLuxy((s) => s.cars);
  const bookings = useLuxy((s) => s.bookings);
  const query = q.trim().toLowerCase();
  const hit = query.length < 2;
  return (
    <div>
      <PageTitle title="Search" />
      <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search everything" className={inputClass} placeholder="Name, plate, code" />
      {hit ? <p className="mt-3 text-sm text-muted">Type at least 2 characters.</p> : (
        <div className="mt-4 space-y-2 text-sm">
          {users.filter((u) => `${u.full_name} ${u.email}`.toLowerCase().includes(query)).map((u) => <p key={u.id}>{u.full_name} · {u.role}</p>)}
          {cars.filter((c) => `${c.name} ${c.plate_number}`.toLowerCase().includes(query)).map((c) => <p key={c.id}>{c.name} · {c.plate_number}</p>)}
          {bookings.filter((b) => b.booking_code.toLowerCase().includes(query)).map((b) => <p key={b.id}>{b.booking_code}</p>)}
        </div>
      )}
    </div>
  );
}

export function Coming({ title }: { title: string }) {
  return <Stub title={title} copy="Agreed as out of scope until the live stack exists." />;
}

export function releasedWalletNote() {
  return wallet([], "owner_amount");
}
