export type Role = "customer" | "owner" | "driver" | "admin";
export type OwnerType = "individual" | "company";
export type CarStatus = "draft" | "active" | "inactive";
export type Approval = "pending" | "approved" | "rejected";
export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "active"
  | "completed"
  | "overdue"
  | "cancelled_pre_pickup"
  | "cancelled_post_pickup";
export type Escrow =
  | "held"
  | "pending_approval"
  | "released"
  | "refunded"
  | "partial_refund";
export type RateType = "daily" | "weekly" | "monthly" | "custom";
export type FeeType = "flat" | "percent";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  phone: string;
  email: string;
  password: string;
  invited_by: string | null;
  created_at: string;
  bio: string;
  owner_type: OwnerType | null;
  car_limit_override: number | null;
};

export type Car = {
  id: string;
  owner_id: string;
  driver_id: string | null;
  name: string;
  make: string;
  model: string;
  year: number;
  location: string;
  description: string;
  image_url: string;
  daily_rate: number;
  weekly_rate: number;
  monthly_rate: number;
  weekly_rate_overridden: boolean;
  monthly_rate_overridden: boolean;
  status: CarStatus;
  self_driven: boolean;
  rating: number | null;
  country: string;
  state: string;
  category: "SUV" | "Sedan" | "Coupe" | "Van" | "Luxury" | "Sports";
  transmission: string;
  seats: number;
  fuel_type: string;
  plate_number: string;
  approval_status: Approval;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  vehicle_licence_number: string;
  ownership_cert_ref: string;
  insurance_provider: string;
  insurance_policy_number: string;
  insurance_expiry: string;
  roadworthiness_expiry: string;
  vehicle_kyc_submitted_at: string | null;
};

export type Booking = {
  id: string;
  booking_code: string;
  car_id: string;
  customer_id: string;
  owner_id: string;
  driver_id: string | null;
  start_date: string;
  end_date: string;
  rate_type: RateType;
  car_rate_total: number;
  owner_amount: number;
  driver_amount: number;
  platform_fee: number;
  total_amount: number;
  pickup_location: string;
  pickup_time: string;
  return_location: string;
  return_time: string;
  special_requests: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  status: BookingStatus;
  escrow_status: Escrow;
  code_requested: boolean;
  code_requested_at: string | null;
  activated_at: string | null;
  scheduled_end_at: string | null;
  trip_ended_at: string | null;
  payment_approved_at: string | null;
  payment_approved_by: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string;
  refund_amount: number;
  created_at: string;
};

export type Review = {
  id: string;
  booking_id: string;
  customer_id: string;
  car_id: string;
  driver_id: string | null;
  trip_rating: number;
  driver_rating: number | null;
  review_text: string;
  created_at: string;
};

export type Favorite = { id: string; customer_id: string; car_id: string; created_at: string };

export type Invite = {
  id: string;
  owner_id: string;
  full_name: string;
  phone: string;
  target_car_id: string | null;
  status: "pending" | "accepted";
  accepted_profile_id: string | null;
  created_at: string;
  accepted_at: string | null;
  owner_approved_at: string | null;
  admin_approved_at: string | null;
  admin_approved_by: string | null;
};

export type SupportRequest = {
  id: string;
  booking_id: string;
  customer_id: string;
  message: string;
  status: "open" | "resolved";
  created_at: string;
  resolved_at: string | null;
};

export type Payout = {
  id: string;
  driver_id: string;
  amount: number;
  requested_at: string;
  status: "requested" | "paid";
  paid_at: string | null;
  paid_by: string | null;
  reference: string;
};

export type Settings = {
  platform_fee_per_day: number;
  driver_fee_per_day: number;
  cancellation_fee_type: FeeType;
  cancellation_fee_value: number;
  logistics_holdback_percent: number;
};

export type CustomerKyc = { nin: string; bvn: string; submitted_at: string | null };
export type DriverKyc = {
  nin: string;
  bvn: string;
  licence_number: string;
  licence_expiry: string;
  photo_id_type: string;
  photo_id_number: string;
  address: string;
  guarantor_name: string;
  guarantor_id: string;
  guarantor_phone: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  submitted_at: string | null;
};
export type OwnerKyc = {
  nin: string;
  bvn: string;
  photo_id_type: string;
  photo_id_number: string;
  address: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  company_name: string;
  cac_number: string;
  tin: string;
  director_name: string;
  director_id: string;
  director_bvn: string;
  board_resolution_ref: string;
  submitted_at: string | null;
};

export type Data = {
  users: Profile[];
  cars: Car[];
  bookings: Booking[];
  reviews: Review[];
  favorites: Favorite[];
  invites: Invite[];
  support: SupportRequest[];
  payouts: Payout[];
  settings: Settings;
  customerKyc: Record<string, CustomerKyc>;
  driverKyc: Record<string, DriverKyc>;
  ownerKyc: Record<string, OwnerKyc>;
  session: { userId: string } | null;
};

export const CATEGORIES = ["All", "SUV", "Sedan", "Coupe", "Van", "Luxury", "Sports"] as const;
export const BLOCKING: BookingStatus[] = ["confirmed", "active", "overdue"];
