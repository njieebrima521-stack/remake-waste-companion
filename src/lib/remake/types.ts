export type MaterialId =
  "plastic" | "mixed_plastic" | "paper" | "glass" | "metal" | "organic" | "general" | "special";

export type PickupKind = "recyclable" | "general";

export type PickupStatus =
  "submitted" | "awaiting" | "assigned" | "on_the_way" | "collected" | "verified" | "cancelled";

export type PickupFlag = "delayed" | "declined";

export type CollectorType = "donkey_cart" | "company" | "tricycle" | "recycler";

/** The three collector experiences in the app. */
export type CollectorCategory = "recycling" | "general" | "independent";

export interface Collector {
  id: string;
  name: string;
  type: CollectorType;
  areas: string[];
  rating: number;
  trips: number;
  availability: string;
  description: string;
  vehicle: string;
  eta: string;
  /** Waste categories this collector takes. A collector only appears for a booking whose category is listed here. */
  accepts: MaterialId[];
  /** Company/organisation logo or the individual's profile photo. A fallback avatar is shown when missing. */
  image?: string;
  sampleRate: string;
  phone: string;
  /** Which collector experience (dashboard, navigation, request rules) this collector gets. */
  category: CollectorCategory;
  /** Remake-issued Collector ID. Assigned by Remake on approval; never editable by the collector. */
  remakeId: string;
  /** Business registration number — a separate number from the Remake Collector ID. Optional for independents. */
  registrationNo?: string;
  /** Contact person for companies; the operator themself for independents. */
  contactName: string;
  email?: string;
  /** How many bags the vehicle or equipment carries in one trip. */
  capacityBags: number;
}

export interface RecyclingPartner {
  id: string;
  name: string;
  accepts: MaterialId[];
  location: string;
  note: string;
}

export interface DetectedItem {
  id: string;
  label: string;
  material: MaterialId;
  count: number;
}

export interface TimelineEntry {
  status: PickupStatus;
  at: string;
  note?: string;
}

export interface Pickup {
  id: string;
  kind: PickupKind;
  material: MaterialId;
  items: DetectedItem[];
  quantity: number;
  description: string;
  photo?: string;
  address: string;
  area: string;
  landmark: string;
  date: string;
  slot: string;
  collectorId: string | null;
  partnerId: string | null;
  status: PickupStatus;
  createdAt: string;
  timeline: TimelineEntry[];
  coins: number;
  flag?: PickupFlag;
  cancelReason?: string;
  /** Opaque, random token encoded in this booking's collection QR code. Holds no personal details. */
  collectionToken: string;
  /** Set when the assigned collector scans the QR code and confirms collection. */
  collectedAt?: string;
  collectedBy?: string;

  // ---- Collector-side request details (institutional requests carry most of these) ----
  /** Set for requests submitted by an institution (school, clinic, market…). Resident bookings have none. */
  institution?: Institution;
  /** Estimated weight in kg, where the requester provided it. */
  estimatedKg?: number;
  /** Whether the waste is separated by material. Treated as true when missing. */
  separated?: boolean;
  /** The requester is still filling bags to reach the minimum. */
  awaitingMore?: boolean;
  /** First date the waste is ready. Treated as the booking date when missing. */
  readyFrom?: string;
  /** The requester accepts a different collection window if asked. */
  flexibleWindow?: boolean;
  /** A collector's proposed new collection window, waiting for or answered by the requester. */
  proposal?: WindowProposal;
  /** Collectors who rejected this request, with their reason. */
  declined?: { collectorId: string; reason: string; at: string }[];
  /** The collection route this request is a stop on. */
  routeId?: string;
  /** Missed pickups and "waste not ready" reports. */
  issues?: PickupIssue[];
  /** Recycling company's check of the material after collection. */
  verification?: MaterialVerification;
  /** A collector reported the waste wasn't ready; cleared when the requester says it is. */
  notReady?: boolean;
}

export interface Institution {
  name: string;
  /** e.g. School, Health centre, Market */
  kind: string;
  /** The Green Champion or institutional contact who submitted the request. */
  contact: string;
  contactRole: string;
  phone: string;
}

export interface WindowProposal {
  collectorId: string;
  date: string;
  slot: string;
  status: "pending" | "agreed" | "declined";
  at: string;
}

export interface PickupIssue {
  kind: "missed" | "not_ready";
  collectorId: string;
  note: string;
  at: string;
  routeId?: string;
}

export type VerificationResult = "accepted" | "needs_sorting" | "rejected";

export interface MaterialVerification {
  by: string;
  at: string;
  received: boolean;
  actualKg: number;
  meetsRequirements: boolean;
  needsSorting: boolean;
  result: VerificationResult;
  note?: string;
}

export type StopState = "pending" | "arrived" | "collected" | "missed" | "not_ready";

export interface RouteStop {
  pickupId: string;
  state: StopState;
  at?: string;
  note?: string;
}

export interface CollectionRoute {
  id: string;
  ref: string;
  name: string;
  collectorId: string;
  zone: string;
  date: string;
  window: string;
  status: "planned" | "in_progress" | "completed";
  stops: RouteStop[];
  createdAt: string;
  completedAt?: string;
}

export type VerificationStatus = "awaiting" | "approved" | "rejected" | "suspended";

/** What a collector submits when registering. */
export interface CollectorApplication {
  category: CollectorCategory;
  fullName: string;
  phone: string;
  email: string;
  remakeId: string;
  registrationNo: string;
  organisation: string;
  areas: string[];
  materials: MaterialId[];
  vehicle: string;
  capacityBags: number;
  image?: string;
}

/** The collector account on this device. Only approved accounts reach collection assignments. */
export interface CollectorAccount {
  status: VerificationStatus;
  /** The Remake collector record this account is linked to once approved. */
  collectorId: string | null;
  application: CollectorApplication;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

/** Ordinary profile details a collector may edit in the demo. */
export interface CollectorEdits {
  contactName?: string;
  phone?: string;
  email?: string;
  vehicle?: string;
  capacityBags?: number;
  available?: boolean;
  image?: string;
  areas?: string[];
}

export interface WorkNotification {
  id: string;
  collectorId: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  kind:
    | "request"
    | "accepted"
    | "rejected"
    | "schedule"
    | "route"
    | "upcoming"
    | "reminder"
    | "confirmation"
    | "verification";
  link?: { to: "request" | "route"; id: string };
}

export type TransactionType = "earn" | "bonus" | "redeem";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  label: string;
  at: string;
  status: "completed" | "pending";
  pickupId?: string;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  tagline: string;
  description: string;
  partner: string;
  delivery: string;
  icon: "gift" | "phone" | "truck" | "bag" | "book" | "droplet" | "trash";
}

export interface Redemption {
  id: string;
  rewardId: string;
  name: string;
  cost: number;
  at: string;
  code: string;
  status: "issued" | "processing";
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  kind: "pickup" | "coins" | "reward" | "tip";
  link?: string;
}

export interface Address {
  id: string;
  label: string;
  line: string;
  area: string;
  landmark: string;
  isDefault: boolean;
}

export interface User {
  name: string;
  phone: string;
  email: string;
  area: string;
}

export interface Draft {
  kind: PickupKind;
  photo?: string;
  scene?: SceneId;
  items: DetectedItem[];
  material?: MaterialId;
  quantity: number;
  description: string;
  address: string;
  area: string;
  landmark: string;
  pin: { x: number; y: number };
  date?: string;
  slot?: string;
  collectorId?: string;
  separatedConfirmed: boolean;
}

export type SceneId = "mixed" | "plastic" | "cans" | "blurry" | "upload";

export interface DemoToggles {
  offline: boolean;
  scanUnavailable: boolean;
  noCollectors: boolean;
}

export type Role = "resident" | "collector";

export interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  signedIn: boolean;
  /** Which experience the signed-in user sees. */
  role: Role;
  collectorAccount: CollectorAccount | null;
  collectorEdits: Record<string, CollectorEdits>;
  /** Collectors approved through the in-app registration demo (added to the sample collectors). */
  registeredCollectors: Collector[];
  routes: CollectionRoute[];
  workNotifications: WorkNotification[];
  /** Minimum bags per waste category before a request becomes a normal assignment. Set by Remake admins. */
  thresholds: Record<MaterialId, number>;
  user: User;
  transactions: Transaction[];
  pickups: Pickup[];
  redemptions: Redemption[];
  notifications: AppNotification[];
  addresses: Address[];
  language: string;
  notificationPrefs: Record<string, boolean>;
  draft: Draft;
  demo: DemoToggles;
}
