import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { TripView } from "@/components/luxy/trip";
import { useLuxy, useHydrated, useUser } from "@/lib/luxy/store";

export function BookingByCode({ code }: { code: string }) {
  const booking = useLuxy((s) => s.bookings.find((b) => b.booking_code.toLowerCase() === code.toLowerCase()));
  const user = useUser();
  if (!booking) return <p className="mx-auto max-w-xl px-4 py-10 text-body">That booking code does not exist.</p>;
  const mine = user?.id === booking.customer_id;
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <TripView booking={booking} showCode={!!mine} showCustomerActions={!!mine} showMoney={user?.role !== "driver"} />
    </div>
  );
}

export function BookingById({ id }: { id: string }) {
  const booking = useLuxy((s) => s.bookings.find((b) => b.id === id));
  const user = useUser();
  const ready = useHydrated();
  const navigate = useNavigate();
  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login", search: { next: `/booking-ref/${id}` } });
    else if (user.role === "customer" && booking) navigate({ to: "/booking/$code", params: { code: booking.booking_code } });
  }, [ready, user, booking, id, navigate]);
  if (!ready || !booking || !user || user.role === "customer") return <p className="p-8 text-sm text-muted">Opening the trip…</p>;
  const allowed = user.role === "admin" || booking.owner_id === user.id || booking.driver_id === user.id;
  if (!allowed) return <p className="p-8">This trip is not yours.</p>;
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <TripView booking={booking} showCode={false} showCustomerActions={false} showMoney={user.role !== "driver"} />
    </div>
  );
}
