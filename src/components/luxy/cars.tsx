import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, MapPin } from "lucide-react";
import { Stars } from "@/components/luxy/bits";
import { carBookedOn, customerDaily, isPublicCar, naira, todayIso } from "@/lib/luxy/pricing";
import { useLuxy, useUser } from "@/lib/luxy/store";
import type { Car } from "@/lib/luxy/types";
import { cn } from "@/lib/utils";

export function CarCard({ car, showHeart = true }: { car: Car; showHeart?: boolean }) {
  const bookings = useLuxy((s) => s.bookings);
  const favorites = useLuxy((s) => s.favorites);
  const toggle = useLuxy((s) => s.toggleFavorite);
  const user = useUser();
  const navigate = useNavigate();
  const settings = useLuxy((s) => s.settings);
  const day = customerDaily(car, settings);
  const booked = carBookedOn(bookings, car.id, todayIso());
  const loved = !!user && favorites.some((f) => f.customer_id === user.id && f.car_id === car.id);

  function heart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate({ to: "/login", search: { next: `/cars/${car.id}` } });
      return;
    }
    if (user.role !== "customer") return;
    toggle(car.id);
  }

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-card">
      <Link to="/cars/$id" params={{ id: car.id }} className="block">
        <div className="relative aspect-[4/3] bg-page">
          <img src={car.image_url} alt={car.name} className="h-full w-full object-cover" />
          <span className={cn("absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium", booked ? "bg-danger-bg text-danger" : "bg-ok-bg text-ok")}>
            {booked ? "Booked today" : "Available"}
          </span>
          {showHeart && user?.role !== "driver" ? (
            <button aria-label={loved ? "Remove favorite" : "Save car"} onClick={heart} className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-card">
              <Heart className={cn("size-4", loved ? "fill-danger text-danger" : "text-ink")} />
            </button>
          ) : null}
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-medium text-ink">{car.name}</h3>
            <Stars value={car.rating} />
          </div>
          <p className="flex items-center gap-1 text-sm text-muted">
            <MapPin className="size-3.5" aria-hidden /> {car.location}
          </p>
          <p className="text-sm text-ink">
            <span className="font-semibold">{naira(day)}</span>
            <span className="text-muted"> / day</span>
          </p>
          <p className="text-xs text-muted">
            {car.transmission} · {car.seats} seats · {car.fuel_type}
          </p>
          <p className="text-xs font-medium text-accent">Professional driver included</p>
        </div>
      </Link>
    </article>
  );
}

export function publicCars(cars: Car[]) {
  return cars.filter(isPublicCar);
}
