import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { carName } from "./catalog";
import {
  carLimit,
  isPublicCar,
  makeCode,
  quote,
  rangeFree,
  recomputeRating,
  refundFor,
  scheduledEnd,
  suggestRates,
  wallet,
} from "./pricing";
import { freshData } from "./seed";
import type {
  Booking,
  Car,
  CustomerKyc,
  Data,
  DriverKyc,
  OwnerKyc,
  OwnerType,
  Profile,
  Role,
} from "./types";

export type LuxyState = Data & {
  signIn: (email: string, password: string) => string | null;
  signOut: () => void;
  signUp: (input: {
    role: "customer" | "owner";
    full_name: string;
    phone: string;
    email: string;
    password: string;
    owner_type?: OwnerType;
  }) => string | null;
  acceptInvite: (inviteId: string, email: string, password: string) => string | null;
  toggleFavorite: (carId: string) => void;
  confirmBooking: (input: Omit<Booking, "id" | "booking_code" | "status" | "escrow_status" | "code_requested" | "code_requested_at" | "activated_at" | "scheduled_end_at" | "trip_ended_at" | "payment_approved_at" | "payment_approved_by" | "completed_at" | "cancelled_at" | "cancellation_reason" | "refund_amount" | "created_at" | "rate_type" | "car_rate_total" | "owner_amount" | "driver_amount" | "platform_fee" | "total_amount"> & { start_date: string; end_date: string }) => { code: string } | { error: string };
  cancelPrePickup: (bookingId: string) => string | null;
  startTrip: (bookingId: string, code: string) => string | null;
  requestCode: (bookingId: string) => string | null;
  approveCodeRequest: (bookingId: string) => string | null;
  endTrip: (bookingId: string) => string | null;
  approvePayment: (bookingId: string) => string | null;
  extendBooking: (bookingId: string, extraDays: number) => string | null;
  reportIssue: (bookingId: string, message: string) => string | null;
  resolveSupport: (id: string) => void;
  addReview: (bookingId: string, trip: number, driver: number | null, text: string) => string | null;
  createCar: (input: Partial<Car> & Pick<Car, "make" | "model" | "year" | "category" | "daily_rate" | "state" | "country" | "plate_number">) => string | null;
  updateCar: (carId: string, patch: Partial<Car>) => string | null;
  assignDriver: (carId: string, mode: "self" | "none" | string) => string | null;
  inviteDriver: (full_name: string, phone: string) => string | null;
  ownerApproveDriver: (inviteId: string) => string | null;
  adminApproveDriver: (inviteId: string) => string | null;
  adminApproveCar: (carId: string) => string | null;
  adminRejectCar: (carId: string, reason: string) => string | null;
  updateSettings: (patch: Partial<Data["settings"]>) => void;
  setCarLimit: (userId: string, limit: number | null) => void;
  saveCustomerKyc: (k: CustomerKyc) => void;
  saveDriverKyc: (k: DriverKyc) => void;
  saveOwnerKyc: (k: OwnerKyc) => void;
  updateBio: (bio: string) => void;
  requestPayout: () => string | null;
  markPayoutPaid: (id: string, reference: string) => string | null;
  adminCancelPost: (bookingId: string, reason: string) => string | null;
  resetDemo: () => void;
};

function uid(prefix: string) {
  return prefix + Math.random().toString(36).slice(2, 8);
}

function me(get: () => LuxyState): Profile | null {
  const id = get().session?.userId;
  if (!id) return null;
  return get().users.find((u) => u.id === id) ?? null;
}

function must(user: Profile | null, role?: Role) {
  if (!user) throw new Error("Sign in required.");
  if (role && user.role !== role) throw new Error("You cannot do that.");
  return user;
}

export const useLuxy = create<LuxyState>()(
  persist(
    (set, get) => ({
      ...freshData(),

      signIn: (email, password) => {
        const user = get().users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
        );
        if (!user) return "Email or password is wrong.";
        set({ session: { userId: user.id } });
        return null;
      },
      signOut: () => set({ session: null }),
      signUp: (input) => {
        const email = input.email.trim().toLowerCase();
        if (input.password.length < 8) return "Password must be at least 8 characters.";
        if (!input.full_name.trim() || !input.phone.trim()) return "Name and phone are required.";
        if (get().users.some((u) => u.email.toLowerCase() === email)) return "That email is already registered.";
        if (input.role === "owner" && !input.owner_type) return "Choose Individual or Company.";
        const user: Profile = {
          id: uid("u-"),
          role: input.role,
          full_name: input.full_name.trim(),
          phone: input.phone.trim(),
          email,
          password: input.password,
          invited_by: null,
          created_at: new Date().toISOString(),
          bio: "",
          owner_type: input.role === "owner" ? input.owner_type ?? "individual" : null,
          car_limit_override: null,
        };
        set({ users: [...get().users, user], session: { userId: user.id } });
        return null;
      },
      acceptInvite: (inviteId, email, password) => {
        const invite = get().invites.find((i) => i.id === inviteId);
        if (!invite) return "This invite does not exist.";
        if (invite.status === "accepted" && invite.accepted_profile_id) {
          const existing = get().users.find((u) => u.id === invite.accepted_profile_id);
          if (existing && existing.password === password && existing.email.toLowerCase() === email.trim().toLowerCase()) {
            set({ session: { userId: existing.id } });
            return null;
          }
          return "This invite was already used. Sign in with the driver account.";
        }
        if (password.length < 8) return "Password must be at least 8 characters.";
        const mail = email.trim().toLowerCase();
        if (get().users.some((u) => u.email.toLowerCase() === mail)) return "That email is already registered.";
        const user: Profile = {
          id: uid("u-"),
          role: "driver",
          full_name: invite.full_name,
          phone: invite.phone,
          email: mail,
          password,
          invited_by: invite.owner_id,
          created_at: new Date().toISOString(),
          bio: "",
          owner_type: null,
          car_limit_override: null,
        };
        set({
          users: [...get().users, user],
          invites: get().invites.map((i) =>
            i.id === inviteId
              ? { ...i, status: "accepted", accepted_profile_id: user.id, accepted_at: new Date().toISOString() }
              : i,
          ),
          session: { userId: user.id },
        });
        return null;
      },
      toggleFavorite: (carId) => {
        const user = must(me(get), "customer");
        const hit = get().favorites.find((f) => f.customer_id === user.id && f.car_id === carId);
        set({
          favorites: hit
            ? get().favorites.filter((f) => f.id !== hit.id)
            : [...get().favorites, { id: uid("f"), customer_id: user.id, car_id: carId, created_at: new Date().toISOString() }],
        });
      },
      confirmBooking: (input) => {
        try {
          const user = must(me(get), "customer");
          const car = get().cars.find((c) => c.id === input.car_id);
          if (!car || !isPublicCar(car)) return { error: "That car is not available to book." };
          if (input.start_date < new Date().toISOString().slice(0, 10) && input.start_date < today()) {
            return { error: "Pickup cannot be in the past." };
          }
          if (input.end_date < input.start_date) return { error: "Return is before pickup." };
          if (!rangeFree(get().bookings, car.id, input.start_date, input.end_date)) {
            return { error: "Those dates overlap another booking." };
          }
          const q = quote(car, input.start_date, input.end_date, get().settings);
          const code = uniqueCode(get().bookings);
          const booking: Booking = {
            id: uid("b-"),
            booking_code: code,
            car_id: car.id,
            customer_id: user.id,
            owner_id: car.owner_id,
            driver_id: car.self_driven ? null : car.driver_id,
            start_date: input.start_date,
            end_date: input.end_date,
            rate_type: q.rateType,
            car_rate_total: q.car_rate_total,
            owner_amount: q.owner_amount,
            driver_amount: q.driver_amount,
            platform_fee: q.platform_fee,
            total_amount: q.total_amount,
            pickup_location: input.pickup_location,
            pickup_time: input.pickup_time,
            return_location: input.return_location,
            return_time: input.return_time,
            special_requests: input.special_requests.slice(0, 150),
            contact_name: input.contact_name,
            contact_phone: input.contact_phone,
            contact_email: input.contact_email,
            status: "confirmed",
            escrow_status: "held",
            code_requested: false,
            code_requested_at: null,
            activated_at: null,
            scheduled_end_at: null,
            trip_ended_at: null,
            payment_approved_at: null,
            payment_approved_by: null,
            completed_at: null,
            cancelled_at: null,
            cancellation_reason: "",
            refund_amount: 0,
            created_at: new Date().toISOString(),
          };
          set({ bookings: [booking, ...get().bookings] });
          return { code };
        } catch (e) {
          return { error: e instanceof Error ? e.message : "Could not book." };
        }
      },
      cancelPrePickup: (bookingId) => {
        const user = me(get);
        if (!user) return "Sign in required.";
        const b = get().bookings.find((x) => x.id === bookingId);
        if (!b) return "Booking not found.";
        if (user.role !== "admin" && b.customer_id !== user.id) return "You cannot cancel this.";
        if (b.status !== "confirmed") return "Only a confirmed trip can be cancelled before pickup.";
        const r = refundFor(b.total_amount, "pre", get().settings);
        set({
          bookings: get().bookings.map((x) =>
            x.id === bookingId
              ? {
                  ...x,
                  status: "cancelled_pre_pickup",
                  escrow_status: r.escrow,
                  refund_amount: r.refund,
                  cancelled_at: new Date().toISOString(),
                  cancellation_reason: "Cancelled before pickup",
                }
              : x,
          ),
        });
        return null;
      },
      startTrip: (bookingId, code) => {
        const user = me(get);
        if (!user) return "Sign in required.";
        const b = get().bookings.find((x) => x.id === bookingId);
        if (!b || b.status !== "confirmed") return "This trip is not waiting for pickup.";
        const car = get().cars.find((c) => c.id === b.car_id);
        const allowed =
          user.role === "admin" ||
          (user.role === "driver" && b.driver_id === user.id) ||
          (user.role === "owner" && car?.self_driven && car.owner_id === user.id);
        if (!allowed) return "You are not the driver for this trip.";
        if (code.trim().toUpperCase() !== b.booking_code) return "That booking code is not correct.";
        return activate(set, get, b.id);
      },
      requestCode: (bookingId) => {
        const user = me(get);
        if (!user || user.role !== "driver") return "Only the assigned driver can request a code.";
        const b = get().bookings.find((x) => x.id === bookingId);
        if (!b || b.driver_id !== user.id || b.status !== "confirmed") return "No confirmed trip to request.";
        set({
          bookings: get().bookings.map((x) =>
            x.id === bookingId ? { ...x, code_requested: true, code_requested_at: new Date().toISOString() } : x,
          ),
        });
        return null;
      },
      approveCodeRequest: (bookingId) => {
        const user = me(get);
        if (!user || user.role !== "admin") return "Admin only.";
        const b = get().bookings.find((x) => x.id === bookingId);
        if (!b || !b.code_requested || b.status !== "confirmed") return "No code request is waiting.";
        return activate(set, get, b.id);
      },
      endTrip: (bookingId) => {
        const user = me(get);
        if (!user) return "Sign in required.";
        const b = get().bookings.find((x) => x.id === bookingId);
        if (!b) return "Booking not found.";
        const live = b.status === "active" || b.status === "overdue";
        if (!live) return "The trip is not active.";
        if (!b.scheduled_end_at || Date.now() < new Date(b.scheduled_end_at).getTime()) {
          return "End Trip unlocks after the booked return time.";
        }
        const car = get().cars.find((c) => c.id === b.car_id);
        const allowed =
          user.role === "admin" ||
          b.driver_id === user.id ||
          (user.role === "owner" && car?.owner_id === user.id);
        if (!allowed) return "You cannot end this trip.";
        const now = new Date().toISOString();
        set({
          bookings: get().bookings.map((x) =>
            x.id === bookingId
              ? { ...x, status: "completed", escrow_status: "pending_approval", trip_ended_at: now }
              : x,
          ),
        });
        return null;
      },
      approvePayment: (bookingId) => {
        const user = me(get);
        if (!user || user.role !== "admin") return "Admin only.";
        const b = get().bookings.find((x) => x.id === bookingId);
        if (!b || b.escrow_status !== "pending_approval") return "Nothing is waiting for approval.";
        const now = new Date().toISOString();
        set({
          bookings: get().bookings.map((x) =>
            x.id === bookingId
              ? {
                  ...x,
                  escrow_status: "released",
                  payment_approved_at: now,
                  payment_approved_by: user.id,
                  completed_at: now,
                }
              : x,
          ),
        });
        return null;
      },
      extendBooking: (bookingId, extraDays) => {
        const user = me(get);
        if (!user) return "Sign in required.";
        if (extraDays < 1) return "Add at least one day.";
        const b = get().bookings.find((x) => x.id === bookingId);
        if (!b || b.customer_id !== user.id) return "You cannot extend this trip.";
        if (b.status !== "active" && b.status !== "overdue") return "Extend is only for an active trip.";
        const car = get().cars.find((c) => c.id === b.car_id);
        if (!car) return "Car missing.";
        const end = addDays(b.end_date, extraDays);
        if (!rangeFree(get().bookings, car.id, b.start_date, end, b.id)) return "Those extra days are already booked.";
        const before = quote(car, b.start_date, b.end_date, get().settings);
        const after = quote(car, b.start_date, end, get().settings);
        const scheduled = b.scheduled_end_at
          ? new Date(new Date(b.scheduled_end_at).getTime() + extraDays * 86400000).toISOString()
          : b.scheduled_end_at;
        set({
          bookings: get().bookings.map((x) =>
            x.id === bookingId
              ? {
                  ...x,
                  end_date: end,
                  rate_type: after.rateType,
                  car_rate_total: after.car_rate_total,
                  owner_amount: after.owner_amount,
                  driver_amount: after.driver_amount,
                  platform_fee: after.platform_fee,
                  total_amount: after.total_amount,
                  scheduled_end_at: scheduled,
                  status: x.status === "overdue" ? "active" : x.status,
                }
              : x,
          ),
        });
        void before;
        return null;
      },
      reportIssue: (bookingId, message) => {
        const user = me(get);
        if (!user) return "Sign in required.";
        const b = get().bookings.find((x) => x.id === bookingId);
        if (!b || b.customer_id !== user.id) return "Not your trip.";
        if (!message.trim()) return "Write what happened.";
        set({
          support: [
            {
              id: uid("s"),
              booking_id: bookingId,
              customer_id: user.id,
              message: message.trim(),
              status: "open",
              created_at: new Date().toISOString(),
              resolved_at: null,
            },
            ...get().support,
          ],
        });
        return null;
      },
      resolveSupport: (id) => {
        const user = me(get);
        if (!user || user.role !== "admin") return;
        set({
          support: get().support.map((s) =>
            s.id === id ? { ...s, status: "resolved", resolved_at: new Date().toISOString() } : s,
          ),
        });
      },
      addReview: (bookingId, trip, driver, text) => {
        const user = me(get);
        if (!user) return "Sign in required.";
        const b = get().bookings.find((x) => x.id === bookingId);
        if (!b || b.customer_id !== user.id) return "Not your trip.";
        if (b.status !== "completed") return "Reviews open after the trip is completed.";
        if (get().reviews.some((r) => r.booking_id === bookingId)) return "You already reviewed this trip.";
        if (trip < 1 || trip > 5) return "Choose a trip rating.";
        if (text.length > 200) return "Keep the note under 200 characters.";
        const review = {
          id: uid("r"),
          booking_id: bookingId,
          customer_id: user.id,
          car_id: b.car_id,
          driver_id: b.driver_id,
          trip_rating: trip,
          driver_rating: driver,
          review_text: text.trim(),
          created_at: new Date().toISOString(),
        };
        const reviews = [review, ...get().reviews];
        set({
          reviews,
          cars: get().cars.map((c) => (c.id === b.car_id ? { ...c, rating: recomputeRating(reviews, c.id) } : c)),
        });
        return null;
      },
      createCar: (input) => {
        const user = must(me(get), "owner");
        const owned = get().cars.filter((c) => c.owner_id === user.id).length;
        if (owned >= carLimit(user)) return `Your account can list ${carLimit(user)} cars.`;
        if (!input.plate_number.trim()) return "Plate number is required.";
        const suggested = suggestRates(input.daily_rate);
        const car: Car = {
          id: uid("c-"),
          owner_id: user.id,
          driver_id: null,
          name: carName(input.make, input.model, input.year),
          make: input.make,
          model: input.model,
          year: input.year,
          location: `${input.state}, ${input.country}`,
          description: input.description ?? "",
          image_url:
            input.image_url ||
            "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80",
          daily_rate: input.daily_rate,
          weekly_rate: input.weekly_rate ?? suggested.weekly_rate,
          monthly_rate: input.monthly_rate ?? suggested.monthly_rate,
          weekly_rate_overridden: input.weekly_rate != null,
          monthly_rate_overridden: input.monthly_rate != null,
          status: "draft",
          self_driven: false,
          rating: null,
          country: input.country,
          state: input.state,
          category: input.category,
          transmission: input.transmission || "Automatic",
          seats: input.seats || 4,
          fuel_type: input.fuel_type || "Petrol",
          plate_number: input.plate_number.trim().toUpperCase(),
          approval_status: "pending",
          approved_at: null,
          approved_by: null,
          rejection_reason: null,
          created_at: new Date().toISOString(),
          vehicle_licence_number: "",
          ownership_cert_ref: "",
          insurance_provider: "",
          insurance_policy_number: "",
          insurance_expiry: "",
          roadworthiness_expiry: "",
          vehicle_kyc_submitted_at: null,
        };
        set({ cars: [car, ...get().cars] });
        return car.id;
      },
      updateCar: (carId, patch) => {
        const user = me(get);
        if (!user) return "Sign in required.";
        const car = get().cars.find((c) => c.id === carId);
        if (!car) return "Car not found.";
        if (user.role !== "admin" && car.owner_id !== user.id) return "Not your car.";
        const sensitive = ["plate_number", "make", "model", "year"] as const;
        const touched = sensitive.some((k) => patch[k] != null && patch[k] !== car[k]);
        let next: Car = { ...car, ...patch };
        if (patch.daily_rate != null && patch.daily_rate !== car.daily_rate) {
          const s = suggestRates(patch.daily_rate);
          if (!next.weekly_rate_overridden && patch.weekly_rate == null) next.weekly_rate = s.weekly_rate;
          if (!next.monthly_rate_overridden && patch.monthly_rate == null) next.monthly_rate = s.monthly_rate;
        }
        if (patch.weekly_rate != null && patch.weekly_rate !== car.weekly_rate) next.weekly_rate_overridden = true;
        if (patch.monthly_rate != null && patch.monthly_rate !== car.monthly_rate) next.monthly_rate_overridden = true;
        next.name = carName(next.make, next.model, next.year);
        next.location = `${next.state}, ${next.country}`;
        if (touched && car.approval_status === "approved" && user.role !== "admin") {
          next = {
            ...next,
            approval_status: "pending",
            approved_at: null,
            approved_by: null,
            rejection_reason: null,
          };
        }
        set({ cars: get().cars.map((c) => (c.id === carId ? next : c)) });
        return null;
      },
      assignDriver: (carId, mode) => {
        const user = me(get);
        if (!user || user.role !== "owner") return "Owners assign drivers.";
        const car = get().cars.find((c) => c.id === carId);
        if (!car || car.owner_id !== user.id) return "Not your car.";
        let cars = get().cars.map((c) => ({ ...c }));
        const target = cars.find((c) => c.id === carId)!;
        if (mode === "none") {
          target.driver_id = null;
          target.self_driven = false;
          if (target.status === "active") target.status = "draft";
        } else if (mode === "self") {
          cars = cars.map((c) =>
            c.owner_id === user.id && c.self_driven && c.id !== carId
              ? { ...c, self_driven: false, status: "draft" as const }
              : c,
          );
          const again = cars.find((c) => c.id === carId)!;
          again.driver_id = null;
          again.self_driven = true;
        } else {
          const invite = get().invites.find(
            (i) => i.accepted_profile_id === mode && i.owner_approved_at && i.admin_approved_at,
          );
          if (!invite) return "That driver is not fully approved.";
          cars = cars.map((c) =>
            c.driver_id === mode && c.id !== carId ? { ...c, driver_id: null, status: "draft" as const } : c,
          );
          const again = cars.find((c) => c.id === carId)!;
          again.driver_id = mode;
          again.self_driven = false;
        }
        set({ cars });
        return null;
      },
      inviteDriver: (full_name, phone) => {
        const user = must(me(get), "owner");
        if (!full_name.trim() || !phone.trim()) return "Name and phone are required.";
        const invite = {
          id: uid("inv-"),
          owner_id: user.id,
          full_name: full_name.trim(),
          phone: phone.trim(),
          target_car_id: null,
          status: "pending" as const,
          accepted_profile_id: null,
          created_at: new Date().toISOString(),
          accepted_at: null,
          owner_approved_at: null,
          admin_approved_at: null,
          admin_approved_by: null,
        };
        set({ invites: [invite, ...get().invites] });
        return invite.id;
      },
      ownerApproveDriver: (inviteId) => {
        const user = me(get);
        if (!user || user.role !== "owner") return "Owners accept drivers.";
        const invite = get().invites.find((i) => i.id === inviteId);
        if (!invite || invite.owner_id !== user.id) return "Not your invite.";
        if (!invite.accepted_profile_id) return "The driver has not signed up yet.";
        const kyc = get().driverKyc[invite.accepted_profile_id];
        if (!kyc?.submitted_at) return "Wait until the driver submits KYC.";
        set({
          invites: get().invites.map((i) =>
            i.id === inviteId ? { ...i, owner_approved_at: new Date().toISOString() } : i,
          ),
        });
        return null;
      },
      adminApproveDriver: (inviteId) => {
        const user = me(get);
        if (!user || user.role !== "admin") return "Admin only.";
        const invite = get().invites.find((i) => i.id === inviteId);
        if (!invite?.owner_approved_at) return "The owner has not accepted this driver.";
        set({
          invites: get().invites.map((i) =>
            i.id === inviteId
              ? { ...i, admin_approved_at: new Date().toISOString(), admin_approved_by: user.id }
              : i,
          ),
        });
        return null;
      },
      adminApproveCar: (carId) => {
        const user = me(get);
        if (!user || user.role !== "admin") return "Admin only.";
        set({
          cars: get().cars.map((c) =>
            c.id === carId
              ? {
                  ...c,
                  approval_status: "approved",
                  approved_at: new Date().toISOString(),
                  approved_by: user.id,
                  rejection_reason: null,
                  status: c.status === "draft" ? "active" : c.status,
                }
              : c,
          ),
        });
        return null;
      },
      adminRejectCar: (carId, reason) => {
        const user = me(get);
        if (!user || user.role !== "admin") return "Admin only.";
        if (!reason.trim()) return "Give a reason.";
        set({
          cars: get().cars.map((c) =>
            c.id === carId
              ? { ...c, approval_status: "rejected", rejection_reason: reason.trim(), status: "draft" }
              : c,
          ),
        });
        return null;
      },
      updateSettings: (patch) => {
        const user = me(get);
        if (!user || user.role !== "admin") return;
        set({ settings: { ...get().settings, ...patch } });
      },
      setCarLimit: (userId, limit) => {
        const user = me(get);
        if (!user || user.role !== "admin") return;
        set({
          users: get().users.map((u) => (u.id === userId ? { ...u, car_limit_override: limit } : u)),
        });
      },
      saveCustomerKyc: (k) => {
        const user = must(me(get));
        set({ customerKyc: { ...get().customerKyc, [user.id]: { ...k, submitted_at: new Date().toISOString() } } });
      },
      saveDriverKyc: (k) => {
        const user = must(me(get), "driver");
        set({ driverKyc: { ...get().driverKyc, [user.id]: { ...k, submitted_at: new Date().toISOString() } } });
      },
      saveOwnerKyc: (k) => {
        const user = must(me(get), "owner");
        set({ ownerKyc: { ...get().ownerKyc, [user.id]: { ...k, submitted_at: new Date().toISOString() } } });
      },
      updateBio: (bio) => {
        const user = must(me(get));
        set({
          users: get().users.map((u) => (u.id === user.id ? { ...u, bio: bio.slice(0, 300) } : u)),
        });
      },
      requestPayout: () => {
        const user = me(get);
        if (!user || user.role !== "driver") return "Drivers only.";
        const lagosSat = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", weekday: "short" }).format(new Date()) === "Sat";
        if (!lagosSat) return "Payout requests open on Saturday, Lagos time.";
        const rows = get().bookings.filter((b) => (b.driver_id === user.id || (b.driver_id == null && false)));
        const mine = get().bookings.filter((b) => b.driver_id === user.id);
        const { available } = wallet(mine, "driver_amount");
        const already = get().payouts
          .filter((p) => p.driver_id === user.id && p.status !== "paid")
          .reduce((a, p) => a + p.amount, 0);
        const paid = get().payouts.filter((p) => p.driver_id === user.id && p.status === "paid").reduce((a, p) => a + p.amount, 0);
        const open = available - paid - already;
        if (open <= 0) return "No released earnings to withdraw.";
        void rows;
        set({
          payouts: [
            {
              id: uid("p"),
              driver_id: user.id,
              amount: open,
              requested_at: new Date().toISOString(),
              status: "requested",
              paid_at: null,
              paid_by: null,
              reference: "",
            },
            ...get().payouts,
          ],
        });
        return null;
      },
      markPayoutPaid: (id, reference) => {
        const user = me(get);
        if (!user || user.role !== "admin") return "Admin only.";
        if (!reference.trim()) return "Add a transfer reference.";
        set({
          payouts: get().payouts.map((p) =>
            p.id === id
              ? { ...p, status: "paid", reference: reference.trim(), paid_at: new Date().toISOString(), paid_by: user.id }
              : p,
          ),
        });
        return null;
      },
      adminCancelPost: (bookingId, reason) => {
        const user = me(get);
        if (!user || user.role !== "admin") return "Admin only.";
        const b = get().bookings.find((x) => x.id === bookingId);
        if (!b) return "Booking not found.";
        if (b.status !== "confirmed" && b.status !== "active" && b.status !== "overdue") {
          return "This trip cannot be cancelled that way.";
        }
        const kind = b.status === "confirmed" ? "pre" : "post";
        const r = refundFor(b.total_amount, kind, get().settings);
        set({
          bookings: get().bookings.map((x) =>
            x.id === bookingId
              ? {
                  ...x,
                  status: kind === "pre" ? "cancelled_pre_pickup" : "cancelled_post_pickup",
                  escrow_status: r.escrow,
                  refund_amount: r.refund,
                  cancelled_at: new Date().toISOString(),
                  cancellation_reason: reason || "Cancelled by admin",
                }
              : x,
          ),
        });
        return null;
      },
      resetDemo: () => set(freshData()),
    }),
    {
      name: "luxy-v1",
      version: 1,
      partialize: (s) => ({
        users: s.users,
        cars: s.cars,
        bookings: s.bookings,
        reviews: s.reviews,
        favorites: s.favorites,
        invites: s.invites,
        support: s.support,
        payouts: s.payouts,
        settings: s.settings,
        customerKyc: s.customerKyc,
        driverKyc: s.driverKyc,
        ownerKyc: s.ownerKyc,
        session: s.session,
      }),
    },
  ),
);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function uniqueCode(bookings: Booking[]) {
  let code = makeCode();
  while (bookings.some((b) => b.booking_code === code)) code = makeCode();
  return code;
}

function activate(
  set: (p: Partial<LuxyState> | ((s: LuxyState) => Partial<LuxyState>)) => void,
  get: () => LuxyState,
  bookingId: string,
) {
  const b = get().bookings.find((x) => x.id === bookingId);
  if (!b) return "Booking not found.";
  const now = new Date().toISOString();
  set({
    bookings: get().bookings.map((x) =>
      x.id === bookingId
        ? {
            ...x,
            status: "active",
            activated_at: now,
            scheduled_end_at: scheduledEnd(now, x.start_date, x.end_date),
            code_requested: false,
          }
        : x,
    ),
  });
  return null;
}

export function useHydrated() {
  const [ready, setReady] = useState(() => useLuxy.persist.hasHydrated());
  useEffect(() => {
    if (useLuxy.persist.hasHydrated()) {
      setReady(true);
      return;
    }
    return useLuxy.persist.onFinishHydration(() => setReady(true));
  }, []);
  return ready;
}

export function useUser() {
  return useLuxy((s) => s.users.find((u) => u.id === s.session?.userId) ?? null);
}

export function useSessionReady() {
  return useLuxy.persist.hasHydrated();
}
