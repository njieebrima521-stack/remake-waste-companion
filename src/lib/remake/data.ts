import type {
  Address,
  AppNotification,
  AppState,
  CollectionRoute,
  Collector,
  CollectorApplication,
  CollectorCategory,
  Institution,
  WorkNotification,
  VerificationStatus,
  DetectedItem,
  Draft,
  MaterialId,
  Pickup,
  PickupStatus,
  RecyclingPartner,
  Redemption,
  Reward,
  SceneId,
  Transaction,
} from "./types";

import { MATERIAL_IMAGE } from "./media";

import imgBanjul from "@/assets/collectors/banjul.jpg";
import imgCompost from "@/assets/collectors/compost.jpg";
import imgFatou from "@/assets/collectors/fatou.jpg";
import imgGreenbelt from "@/assets/collectors/greenbelt.jpg";
import imgKanifing from "@/assets/collectors/kanifing.jpg";
import imgKombo from "@/assets/collectors/kombo.jpg";
import imgLamin from "@/assets/collectors/lamin.jpg";
import imgModou from "@/assets/collectors/modou.jpg";
import imgRebottle from "@/assets/collectors/rebottle.jpg";
import imgSahel from "@/assets/collectors/sahel.jpg";

/* All names, companies, rates and records below are illustrative demonstration data. */

export const AREAS = [
  "Bakau",
  "Banjul",
  "Brikama",
  "Brusubi",
  "Bundung",
  "Busumbala",
  "Fajara",
  "Kanifing",
  "Kololi",
  "Kotu",
  "Latrikunda",
  "Serrekunda",
] as const;

export const TIME_SLOTS = [
  "08:00 – 10:00",
  "10:00 – 12:00",
  "14:00 – 16:00",
  "16:00 – 18:00",
] as const;

export const LANGUAGES = [
  { id: "en", name: "English", native: "English" },
  { id: "wo", name: "Wolof", native: "Wolof" },
  { id: "mnk", name: "Mandinka", native: "Mandinka" },
  { id: "ff", name: "Fula", native: "Pulaar" },
  { id: "fr", name: "French", native: "Français" },
] as const;

/** Green Coins awarded per bag, by material (demonstration rates). */
export const COIN_RATES: Record<MaterialId, number> = {
  plastic: 50,
  mixed_plastic: 0,
  metal: 80,
  paper: 30,
  glass: 40,
  organic: 20,
  general: 0,
  special: 0,
};

export const RECYCLABLE: MaterialId[] = ["plastic", "paper", "glass", "metal"];

export const STATUS_FLOW: PickupStatus[] = [
  "submitted",
  "awaiting",
  "assigned",
  "on_the_way",
  "collected",
  "verified",
];

export const STATUS_LABEL: Record<PickupStatus, string> = {
  submitted: "Booking confirmed",
  awaiting: "Awaiting collector",
  assigned: "Collector assigned",
  on_the_way: "On the way",
  collected: "Collected",
  verified: "Verified",
  cancelled: "Cancelled",
};

export interface MaterialInfo {
  id: MaterialId;
  name: string;
  short: string;
  examples: string;
  accepted: string[];
  rejected: string[];
  prep: string[];
  tip: string;
}

export const MATERIALS: Record<MaterialId, MaterialInfo> = {
  plastic: {
    id: "plastic",
    name: "Plastic",
    short: "Plastic",
    examples: "Bottles, buckets, chairs, cups",
    accepted: [
      "Water and soft-drink bottles (PET)",
      "Cooking-oil and juice containers",
      "Buckets, basins and broken plastic chairs",
      "Plastic cups and food containers (rinsed)",
    ],
    rejected: [
      "Thin 'pure water' sachets mixed with food",
      "Plastic with oil or chemical residue",
      "Nappies and sanitary items",
      "Styrofoam packaging",
    ],
    prep: [
      "Empty and rinse bottles and containers.",
      "Remove caps and keep them in the same bag.",
      "Squash bottles flat to save space.",
      "Keep plastics dry and in their own bag.",
    ],
    tip: "Ten flattened bottles fit where three whole ones would.",
  },
  mixed_plastic: {
    id: "mixed_plastic",
    name: "Mixed plastics (non-recyclable)",
    short: "Mixed plastics",
    examples: "Sachets, wrappers, dirty plastic bags",
    accepted: [
      "Used 'pure water' sachets",
      "Sweet wrappers and crisp packets",
      "Dirty, torn or tangled plastic bags",
      "Plastics mixed together that can't be sorted",
    ],
    rejected: [
      "Clean bottles and containers — book them as Plastic to earn coins",
      "Glass, metal or cardboard",
      "Batteries and electronics",
    ],
    prep: [
      "Shake out food and liquids.",
      "Tie everything in one strong bag.",
      "Never burn plastic waste.",
    ],
    tip: "Recycling partners can't take mixed plastics, so a general waste operator collects them. They don't earn Green Coins.",
  },
  paper: {
    id: "paper",
    name: "Paper & cardboard",
    short: "Paper",
    examples: "Boxes, newspapers, paper bags",
    accepted: [
      "Cardboard boxes (flattened)",
      "Newspapers, magazines and flyers",
      "Exercise books and office paper",
      "Paper bags and egg trays",
    ],
    rejected: [
      "Wet, oily or food-stained paper",
      "Tissues and paper towels",
      "Wax- or plastic-coated cups",
      "Photographs and receipts",
    ],
    prep: [
      "Flatten all boxes.",
      "Remove tape, plastic windows and staples where possible.",
      "Tie paper in bundles or place in a dry bag.",
      "Store indoors so it stays dry.",
    ],
    tip: "Rain-soaked cardboard can't be recycled — keep it covered.",
  },
  glass: {
    id: "glass",
    name: "Glass",
    short: "Glass",
    examples: "Bottles, jars, mirrors",
    accepted: [
      "Drink bottles — clear, green and brown",
      "Food jars (rinsed, lids removed)",
      "Perfume and sauce bottles",
    ],
    rejected: [
      "Window glass and mirrors",
      "Light bulbs and tubes",
      "Drinking glasses and ceramics",
      "Broken glass mixed with other waste",
    ],
    prep: [
      "Empty and rinse bottles and jars.",
      "Remove metal or plastic lids — recycle them separately.",
      "Keep glass whole where possible.",
      "Pack carefully in a strong bag or box.",
    ],
    tip: "Wrap any sharp pieces in paper and label the bag for the collector's safety.",
  },
  metal: {
    id: "metal",
    name: "Metals & cans",
    short: "Metal",
    examples: "Cans, tables, gas containers",
    accepted: [
      "Aluminium drink cans",
      "Tin food cans (tomato paste, milk)",
      "Old pots, pans and metal tables",
      "Scrap iron and wire",
    ],
    rejected: [
      "Gas cylinders that are not empty",
      "Paint or chemical tins with residue",
      "Aerosol cans that still spray",
    ],
    prep: [
      "Empty and rinse cans.",
      "Crush drink cans to save space.",
      "Keep sharp edges folded inwards.",
      "Separate large scrap items from cans.",
    ],
    tip: "Metal earns the most Green Coins per bag.",
  },
  organic: {
    id: "organic",
    name: "Organic waste",
    short: "Organic",
    examples: "Food scraps, peels, leaves",
    accepted: [
      "Fruit and vegetable peels",
      "Leftover rice, bread and cooked food",
      "Leaves, grass and garden cuttings",
      "Eggshells and coffee grounds",
    ],
    rejected: [
      "Plastic bags and wrappers",
      "Bones in large amounts",
      "Animal waste",
      "Oil and fat",
    ],
    prep: [
      "Keep organic waste separate from plastics.",
      "Drain liquids before bagging.",
      "Use a covered container to keep animals away.",
      "Hand over within two days to avoid smells.",
    ],
    tip: "Organic waste makes great compost for home gardens.",
  },
  general: {
    id: "general",
    name: "General waste",
    short: "General",
    examples: "Mixed household rubbish",
    accepted: [
      "Mixed household rubbish in tied bags",
      "Sweepings and dust",
      "Dirty or soiled packaging",
      "Nappies and sanitary items (double bagged)",
    ],
    rejected: [
      "Batteries and electronics",
      "Medical needles and medicines",
      "Building rubble",
      "Hot ashes",
    ],
    prep: [
      "Tie bags securely.",
      "Double-bag anything wet or smelly.",
      "Place bags at your gate on collection day.",
      "Take out recyclables first to earn Green Coins.",
    ],
    tip: "Every bottle you separate is one less in the dumpsite — and coins for you.",
  },
  special: {
    id: "special",
    name: "Special waste",
    short: "Special",
    examples: "Batteries, phones, bulbs, paint",
    accepted: [
      "Used batteries (any size)",
      "Old phones, chargers and small electronics",
      "Energy-saving bulbs",
      "Small paint and chemical tins",
    ],
    rejected: ["Mixing with general waste", "Burning", "Pouring chemicals on the ground"],
    prep: [
      "Store special waste in a dry box away from children.",
      "Tape battery ends.",
      "Never burn or break open electronics.",
      "Keep until a special-waste collection is announced.",
    ],
    tip: "Special waste is not collected in this demo — store it safely for a future drop-off day.",
  },
};

export const GUIDE_ORDER: MaterialId[] = [
  "plastic",
  "mixed_plastic",
  "paper",
  "glass",
  "metal",
  "organic",
  "general",
  "special",
];

/**
 * Each collector lists the exact waste categories it takes. Recycling organisations only take
 * sorted recyclables; non-recyclable waste goes to general/private waste operators.
 */
export const COLLECTORS: Collector[] = [
  {
    id: "c-lamin",
    name: "Lamin Jallow",
    type: "donkey_cart",
    areas: ["Bundung", "Serrekunda", "Latrikunda"],
    rating: 4.8,
    trips: 312,
    availability: "Mon – Sat · 7am – 4pm",
    description: "Neighbourhood donkey-cart operator. Collects sorted plastic, paper and cans.",
    vehicle: "Donkey cart",
    eta: "Arrives within your slot",
    accepts: ["plastic", "paper", "metal"],
    sampleRate: "D25 per bag",
    phone: "+220 701 0001",
    image: imgLamin,
    category: "independent",
    remakeId: "RMK-C-3302",
    contactName: "Lamin Jallow",
    capacityBags: 8,
  },
  {
    id: "c-kombo",
    name: "Kombo Recycling Collectors",
    type: "recycler",
    areas: ["Serrekunda", "Kololi", "Brusubi", "Bundung", "Bakau", "Banjul"],
    rating: 4.7,
    trips: 980,
    availability: "Tue – Sun · 9am – 5pm",
    description: "Collects sorted recyclables only and delivers straight to partner recyclers.",
    vehicle: "Pick-up van",
    eta: "Call on arrival",
    accepts: ["plastic", "paper", "glass", "metal"],
    sampleRate: "Free for sorted recyclables",
    phone: "+220 701 0004",
    image: imgKombo,
    category: "recycling",
    remakeId: "RMK-C-1101",
    registrationNo: "BRS-2019-04417",
    contactName: "Awa Sanneh",
    email: "ops@kombo-recycling.example",
    capacityBags: 40,
  },
  {
    id: "c-rebottle",
    name: "ReBottle Gambia",
    type: "recycler",
    areas: ["Kanifing", "Latrikunda", "Serrekunda", "Kotu"],
    rating: 4.6,
    trips: 540,
    availability: "Mon – Sat · 8am – 4pm",
    description: "Plastic recycling organisation. Takes clean bottles and hard plastics only.",
    vehicle: "Box van",
    eta: "Text message 30 min before arrival",
    accepts: ["plastic"],
    sampleRate: "Free for clean plastic",
    phone: "+220 701 0008",
    image: imgRebottle,
    category: "recycling",
    remakeId: "RMK-C-1102",
    registrationNo: "BRS-2021-01882",
    contactName: "Omar Ceesay",
    email: "hello@rebottle.example",
    capacityBags: 60,
  },
  {
    id: "c-sahel",
    name: "Sahel Scrap Collectors",
    type: "recycler",
    areas: ["Kanifing", "Bundung", "Serrekunda", "Brikama"],
    rating: 4.5,
    trips: 760,
    availability: "Mon – Fri · 8am – 5pm",
    description: "Metal and can recycler. Weighs cans and scrap at your gate.",
    vehicle: "Flatbed truck",
    eta: "Call on arrival",
    accepts: ["metal"],
    sampleRate: "Free for cans and scrap",
    phone: "+220 701 0009",
    image: imgSahel,
    category: "recycling",
    remakeId: "RMK-C-1103",
    registrationNo: "BRS-2017-00931",
    contactName: "Pa Modou Jobe",
    email: "scrap@sahel.example",
    capacityBags: 80,
  },
  {
    id: "c-modou",
    name: "Modou Sowe",
    type: "donkey_cart",
    areas: ["Bakau", "Fajara", "Kotu", "Bundung"],
    rating: 4.4,
    trips: 158,
    availability: "Mon – Sat · 8am – 3pm",
    description: "Family-run donkey cart. Collects glass bottles and household rubbish.",
    vehicle: "Donkey cart",
    eta: "Arrives within your slot",
    accepts: ["glass", "general", "mixed_plastic"],
    sampleRate: "D25 per bag",
    phone: "+220 701 0006",
    image: imgModou,
    category: "independent",
    remakeId: "RMK-C-3301",
    contactName: "Modou Sowe",
    capacityBags: 8,
  },
  {
    id: "c-fatou",
    name: "Fatou Ceesay",
    type: "donkey_cart",
    areas: ["Brikama", "Busumbala", "Brusubi", "Bundung"],
    rating: 4.9,
    trips: 205,
    availability: "Mon – Sat · 7am – 2pm",
    description: "Donkey-cart operator taking food and garden waste to local compost sites.",
    vehicle: "Donkey cart",
    eta: "Arrives within your slot",
    accepts: ["organic", "general"],
    sampleRate: "D20 per bag",
    phone: "+220 701 0005",
    image: imgFatou,
    category: "independent",
    remakeId: "RMK-C-3303",
    contactName: "Fatou Ceesay",
    capacityBags: 8,
  },
  {
    id: "c-compost",
    name: "Kombo Compost Collective",
    type: "recycler",
    areas: ["Brikama", "Bundung", "Serrekunda", "Brusubi"],
    rating: 4.7,
    trips: 430,
    availability: "Tue – Sat · 7am – 1pm",
    description: "Community composting group collecting food scraps and garden cuttings.",
    vehicle: "Cargo tricycle",
    eta: "Arrives within your slot",
    accepts: ["organic"],
    sampleRate: "Free for organic waste",
    phone: "+220 701 0010",
    image: imgCompost,
    category: "recycling",
    remakeId: "RMK-C-1104",
    registrationNo: "CBO-2020-0316",
    contactName: "Mariama Darboe",
    email: "compost@kombo.example",
    capacityBags: 20,
  },
  {
    id: "c-greenbelt",
    name: "GreenBelt Waste Services",
    type: "company",
    areas: ["Kololi", "Kotu", "Bakau", "Serrekunda", "Brusubi", "Bundung"],
    rating: 4.6,
    trips: 1840,
    availability: "Daily · 6am – 6pm",
    description: "Private waste company with covered trucks for household and mixed waste.",
    vehicle: "Covered truck",
    eta: "Text message 30 min before arrival",
    accepts: ["general", "mixed_plastic"],
    sampleRate: "D60 per bag",
    phone: "+220 701 0002",
    image: imgGreenbelt,
    category: "general",
    remakeId: "RMK-C-2201",
    registrationNo: "BRS-2015-02240",
    contactName: "Ebou Touray",
    email: "dispatch@greenbelt.example",
    capacityBags: 120,
  },
  {
    id: "c-kanifing",
    name: "Kanifing Clean Crew",
    type: "tricycle",
    areas: ["Kanifing", "Latrikunda", "Bundung", "Serrekunda"],
    rating: 4.5,
    trips: 640,
    availability: "Mon – Fri · 8am – 5pm",
    description: "Youth-run tricycle crew collecting household rubbish and mixed plastics.",
    vehicle: "Cargo tricycle",
    eta: "Arrives within your slot",
    accepts: ["general", "mixed_plastic"],
    sampleRate: "D35 per bag",
    phone: "+220 701 0003",
    image: imgKanifing,
    category: "general",
    remakeId: "RMK-C-2202",
    registrationNo: "BRS-2022-03118",
    contactName: "Alieu Bojang",
    email: "crew@kanifing-clean.example",
    capacityBags: 25,
  },
  {
    id: "c-banjul",
    name: "Banjul City Haulage",
    type: "company",
    areas: ["Banjul", "Bakau"],
    rating: 4.3,
    trips: 2210,
    availability: "Daily · 6am – 8pm",
    description: "Private hauler handling large household and street clean-ups.",
    vehicle: "Tipper truck",
    eta: "Text message on the day",
    accepts: ["general", "mixed_plastic"],
    sampleRate: "D75 per bag",
    phone: "+220 701 0007",
    image: imgBanjul,
    category: "general",
    remakeId: "RMK-C-2203",
    registrationNo: "BRS-2012-00475",
    contactName: "Sainey Faal",
    email: "haulage@banjul-city.example",
    capacityBags: 150,
  },
];

export const COLLECTOR_CATEGORY_LABEL: Record<CollectorCategory, string> = {
  recycling: "Recycling company",
  general: "Private general-waste company",
  independent: "Independent operator",
};

/** Waste categories each collector type may apply to handle. Remake approves the final list. */
export const CATEGORY_MATERIALS: Record<CollectorCategory, MaterialId[]> = {
  recycling: ["plastic", "glass", "metal", "paper", "organic"],
  general: ["general", "mixed_plastic"],
  independent: ["general", "mixed_plastic", "plastic", "paper", "metal", "glass", "organic"],
};

export const VEHICLE_OPTIONS: Record<CollectorCategory, string[]> = {
  recycling: ["Pick-up van", "Box van", "Flatbed truck", "Cargo tricycle"],
  general: ["Covered truck", "Tipper truck", "Cargo tricycle", "Skip lorry"],
  independent: ["Donkey cart", "Hand cart", "Cargo tricycle", "Wheelbarrow"],
};

/**
 * Collection zones. Areas are listed in the order a collector would drive through them,
 * which the demo uses as its stand-in for geographic proximity (no GPS or route optimisation).
 */
export const ZONES: { id: string; name: string; areas: string[] }[] = [
  { id: "KAN", name: "Kanifing zone", areas: ["Kanifing", "Latrikunda", "Bundung", "Serrekunda"] },
  { id: "CST", name: "Coastal zone", areas: ["Bakau", "Fajara", "Kotu", "Kololi"] },
  { id: "BJL", name: "Banjul", areas: ["Banjul"] },
  { id: "BRK", name: "Brikama zone", areas: ["Brusubi", "Busumbala", "Brikama"] },
];

/** Sample minimum bags before a request becomes a normal assignment. Remake admins can change these. */
export const DEFAULT_THRESHOLDS: Record<MaterialId, number> = {
  plastic: 3,
  mixed_plastic: 2,
  paper: 3,
  glass: 2,
  metal: 2,
  organic: 4,
  general: 1,
  special: 1,
};

/** Rough kg per bag, used only when no weight was given. */
export const KG_PER_BAG: Record<MaterialId, number> = {
  plastic: 4,
  mixed_plastic: 5,
  paper: 6,
  glass: 12,
  metal: 8,
  organic: 10,
  general: 9,
  special: 5,
};

export interface SampleAccount {
  key: string;
  /** Phone number (7 digits) used to sign in to this sample account. */
  phone: string;
  status: VerificationStatus;
  /** The collector record this account belongs to; null until Remake approves it. */
  collectorId: string | null;
  application: CollectorApplication;
  reviewNote?: string;
}

function applicationFor(c: Collector): CollectorApplication {
  const app: CollectorApplication = {
    category: c.category,
    fullName: c.contactName,
    phone: c.phone.replace(/\D/g, "").slice(-7),
    email: c.email ?? "",
    remakeId: c.remakeId,
    registrationNo: c.registrationNo ?? "",
    organisation: c.category === "independent" ? "" : c.name,
    areas: c.areas,
    materials: c.accepts,
    vehicle: c.vehicle,
    capacityBags: c.capacityBags,
  };
  if (c.image) app.image = c.image;
  return app;
}

const byId = (id: string) => COLLECTORS.find((c) => c.id === id)!;

/**
 * Sample collector accounts for the demo sign-in. In production Remake verifies every collector
 * independently; here each sample account has a fixed verification state so every case can be shown.
 */
export const SAMPLE_ACCOUNTS: SampleAccount[] = [
  ...["c-kombo", "c-greenbelt", "c-lamin", "c-kanifing", "c-modou", "c-rebottle"].map((id) => {
    const c = byId(id);
    return {
      key: id,
      phone: applicationFor(c).phone,
      status: "approved" as const,
      collectorId: id,
      application: applicationFor(c),
    };
  }),
  {
    key: "c-banjul",
    phone: applicationFor(byId("c-banjul")).phone,
    status: "suspended",
    collectorId: "c-banjul",
    application: applicationFor(byId("c-banjul")),
    reviewNote:
      "Suspended by Remake pending a review of missed collections. Contact Remake to resolve it.",
  },
  {
    key: "s-awaiting",
    phone: "7010021",
    status: "awaiting",
    collectorId: null,
    application: {
      category: "independent",
      fullName: "Isatou Jammeh",
      phone: "7010021",
      email: "",
      remakeId: "",
      registrationNo: "",
      organisation: "",
      areas: ["Brikama", "Busumbala"],
      materials: ["plastic", "metal"],
      vehicle: "Cargo tricycle",
      capacityBags: 10,
    },
    reviewNote: "Remake is checking your details. This usually takes 2 working days.",
  },
  {
    key: "s-rejected",
    phone: "7010022",
    status: "rejected",
    collectorId: null,
    application: {
      category: "recycling",
      fullName: "Bakary Saidy",
      phone: "7010022",
      email: "info@coastline-recyclers.example",
      remakeId: "",
      registrationNo: "BRS-2024-99120",
      organisation: "Coastline Recyclers",
      areas: ["Kotu", "Kololi"],
      materials: ["plastic", "glass"],
      vehicle: "Pick-up van",
      capacityBags: 30,
    },
    reviewNote:
      "The business registration number could not be confirmed with the Registrar of Companies.",
  },
];

/** Collectors Remake has suspended: they get no new requests until the review is resolved. */
export const SUSPENDED_COLLECTORS = ["c-banjul"];

export const DEMO_COLLECTOR_PASSWORD = "remake123";

export const REJECT_REASONS = [
  "Outside my service area today",
  "Vehicle full for that day",
  "Waste not separated properly",
  "Location unsafe or hard to reach",
  "Other",
] as const;

export const PARTNERS: RecyclingPartner[] = [
  {
    id: "p-plastic",
    name: "Kombo Plastics Recovery",
    accepts: ["plastic"],
    location: "Serrekunda",
    note: "Turns bottles into flakes for new products.",
  },
  {
    id: "p-metal",
    name: "Sahel Metal Works",
    accepts: ["metal"],
    location: "Kanifing Industrial Estate",
    note: "Buys cans and scrap for smelting.",
  },
  {
    id: "p-paper",
    name: "Atlantic Paper Collective",
    accepts: ["paper"],
    location: "Latrikunda",
    note: "Bales cardboard and paper for export.",
  },
  {
    id: "p-glass",
    name: "Coastline Glass Reuse",
    accepts: ["glass"],
    location: "Bakau",
    note: "Cleans and refills bottles for local producers.",
  },
  {
    id: "p-organic",
    name: "Green Fields Compost",
    accepts: ["organic"],
    location: "Brikama",
    note: "Makes compost for school gardens.",
  },
];

export const REWARDS: Reward[] = [
  {
    id: "r-airtime",
    name: "Airtime",
    cost: 220,
    tagline: "D50 mobile top-up",
    description: "Top up any Gambian mobile number with D50 airtime. Delivered by SMS voucher.",
    partner: "Sample mobile network",
    delivery: "Instant SMS voucher",
    icon: "phone",
  },
  {
    id: "r-bag",
    name: "Shopping bag",
    cost: 350,
    tagline: "Reusable woven bag",
    description: "A strong, reusable woven shopping bag made by local weavers.",
    partner: "Sample partner market stall",
    delivery: "Collect from a partner shop",
    icon: "bag",
  },
  {
    id: "r-bin",
    name: "Trash bin",
    cost: 500,
    tagline: "Lidded household bin",
    description: "A 40-litre lidded bin to keep your compound clean and animals out.",
    partner: "Sample hardware shop",
    delivery: "Delivered with your next pickup",
    icon: "trash",
  },
  {
    id: "r-delivery",
    name: "Free delivery",
    cost: 1000,
    tagline: "One free delivery",
    description: "One free local delivery with a partner delivery service in the Kombos.",
    partner: "Sample delivery partner",
    delivery: "Voucher code by SMS",
    icon: "truck",
  },
  {
    id: "r-books",
    name: "Books",
    cost: 2200,
    tagline: "School exercise book pack",
    description: "A pack of 10 exercise books and pens for the school term.",
    partner: "Sample bookshop",
    delivery: "Collect from a partner shop",
    icon: "book",
  },
  {
    id: "r-water",
    name: "Water dispenser",
    cost: 10000,
    tagline: "Table-top dispenser",
    description: "A table-top water dispenser — the top reward for committed recyclers.",
    partner: "Sample electronics shop",
    delivery: "Home delivery",
    icon: "droplet",
  },
];

export const FAQS = [
  {
    q: "What are Green Coins?",
    a: "Green Coins are points you earn when collectors verify your sorted recyclables. Redeem them for airtime, bags, books and more.",
  },
  {
    q: "Why are some of my coins pending?",
    a: "Coins stay pending until the recycling partner weighs and verifies your materials. This usually takes 1–2 days.",
  },
  {
    q: "Why must I separate mixed waste?",
    a: "Recycling partners only accept one material per bag. Separated plastic, paper, glass and metal can be recycled — mixed bags cannot.",
  },
  {
    q: "How much does general waste collection cost?",
    a: "Each collector sets their own fee. You pay the collector directly. Rates shown in this demo are samples only.",
  },
  {
    q: "Can I cancel a pickup?",
    a: "Yes — open the pickup and tap Cancel any time before it is collected.",
  },
  {
    q: "What if my collector doesn't come?",
    a: "You'll be notified if a pickup is delayed or declined and can choose another collector in one tap.",
  },
  {
    q: "Is the waste scan accurate?",
    a: "In this demonstration the scan shows sample results only. Always check and edit the detected materials before booking.",
  },
];

export const SCENES: Record<
  Exclude<SceneId, "upload">,
  { label: string; items: DetectedItem[] }
> = {
  mixed: {
    label: "Mixed",
    items: [
      { id: "d1", label: "Plastic bottles", material: "plastic", count: 9 },
      { id: "d2", label: "Drink cans", material: "metal", count: 6 },
      { id: "d3", label: "Cardboard box", material: "paper", count: 1 },
    ],
  },
  plastic: {
    label: "Plastic",
    items: [
      { id: "d1", label: "Plastic bottles", material: "plastic", count: 6 },
      { id: "d2", label: "Food containers", material: "plastic", count: 4 },
    ],
  },
  cans: {
    label: "Cans",
    items: [
      { id: "d1", label: "Drink cans", material: "metal", count: 6 },
      { id: "d2", label: "Food tins", material: "metal", count: 4 },
    ],
  },
  blurry: { label: "Blurry", items: [] },
};

export const UPLOAD_SAMPLE_ITEMS: DetectedItem[] = [
  { id: "d1", label: "Drink cans", material: "metal", count: 2 },
  { id: "d2", label: "Plastic bottles", material: "plastic", count: 3 },
];

export function emptyDraft(kind: Draft["kind"] = "recyclable"): Draft {
  return {
    kind,
    items: [],
    quantity: 1,
    description: "",
    address: "",
    area: "",
    landmark: "",
    pin: { x: 50, y: 50 },
    separatedConfirmed: false,
  };
}

const day = 24 * 60 * 60 * 1000;
const hour = 60 * 60 * 1000;

function iso(t: number) {
  return new Date(t).toISOString();
}
function dateOnly(t: number) {
  return new Date(t).toISOString().slice(0, 10);
}

function timeline(statuses: PickupStatus[], start: number, step = hour): Pickup["timeline"] {
  return statuses.map((status, i) => ({ status, at: iso(start + i * step) }));
}

/** Builds the demonstration account relative to `now`. */
export function seedState(now: number): AppState {
  const addresses: Address[] = [
    {
      id: "a-home",
      label: "Home",
      line: "Compound 14, Kombo Coastal Road",
      area: "Bundung",
      landmark: "Opposite Bundung mosque",
      isDefault: true,
    },
    {
      id: "a-work",
      label: "Work",
      line: "Plot 22, Kairaba Avenue",
      area: "Kanifing",
      landmark: "Near the traffic lights",
      isDefault: false,
    },
  ];
  const home = addresses[0]!;

  const pickups: Pickup[] = [
    {
      id: "RMK-1042",
      collectionToken: "K7F39QX2MZ4HB8TW",
      kind: "recyclable",
      material: "plastic",
      items: [{ id: "i1", label: "Plastic bottles", material: "plastic", count: 24 }],
      quantity: 3,
      description: "",
      address: home.line,
      area: home.area,
      landmark: home.landmark,
      date: dateOnly(now),
      slot: "10:00 – 12:00",
      collectorId: "c-lamin",
      partnerId: "p-plastic",
      status: "on_the_way",
      createdAt: iso(now - day),
      timeline: timeline(["submitted", "awaiting", "assigned", "on_the_way"], now - day, 5 * hour),
      coins: 150,
    },
    {
      id: "RMK-1044",
      collectionToken: "P2DN6VR8CJ5YQ3LA",
      kind: "recyclable",
      material: "metal",
      items: [{ id: "i1", label: "Drink cans", material: "metal", count: 40 }],
      quantity: 2,
      description: "",
      address: home.line,
      area: home.area,
      landmark: home.landmark,
      date: dateOnly(now),
      slot: "14:00 – 16:00",
      collectorId: "c-sahel",
      partnerId: "p-metal",
      status: "assigned",
      createdAt: iso(now - 2 * day),
      timeline: [...timeline(["submitted", "awaiting", "assigned"], now - 2 * day, 3 * hour)],
      coins: 160,
      flag: "delayed",
    },
    {
      id: "RMK-1043",
      collectionToken: "W9HT4KE7NB2MX6RD",
      kind: "general",
      material: "general",
      items: [],
      quantity: 2,
      description: "Two tied bags of household rubbish by the gate.",
      address: home.line,
      area: home.area,
      landmark: home.landmark,
      date: dateOnly(now + day),
      slot: "08:00 – 10:00",
      collectorId: "c-greenbelt",
      partnerId: null,
      status: "assigned",
      createdAt: iso(now - 3 * hour),
      timeline: timeline(["submitted", "awaiting", "assigned"], now - 3 * hour, 40 * 60 * 1000),
      coins: 0,
    },
    {
      id: "RMK-1045",
      collectionToken: "B5QZ8LM3TY7GC2NV",
      kind: "general",
      material: "general",
      items: [],
      quantity: 1,
      description: "Garden sweepings, one bag.",
      address: addresses[1]!.line,
      area: addresses[1]!.area,
      landmark: addresses[1]!.landmark,
      date: dateOnly(now + 3 * day),
      slot: "16:00 – 18:00",
      collectorId: null,
      partnerId: null,
      status: "awaiting",
      createdAt: iso(now - 5 * hour),
      timeline: timeline(["submitted", "awaiting"], now - 5 * hour, hour),
      coins: 0,
      flag: "declined",
    },
    {
      id: "RMK-1039",
      collectionToken: "H4JX2RW9DF6KP8SE",
      kind: "recyclable",
      material: "paper",
      items: [{ id: "i1", label: "Cardboard boxes", material: "paper", count: 15 }],
      quantity: 5,
      description: "",
      address: home.line,
      area: home.area,
      landmark: home.landmark,
      date: dateOnly(now - day),
      slot: "10:00 – 12:00",
      collectorId: "c-kombo",
      partnerId: "p-paper",
      status: "collected",
      collectedAt: iso(now - 3 * day + 40 * hour),
      collectedBy: "c-kombo",
      createdAt: iso(now - 3 * day),
      timeline: timeline(
        ["submitted", "awaiting", "assigned", "on_the_way", "collected"],
        now - 3 * day,
        10 * hour,
      ),
      coins: 150,
    },
    {
      id: "RMK-1031",
      collectionToken: "T8MC5NA3VQ9ZK2HW",
      kind: "recyclable",
      material: "plastic",
      items: [{ id: "i1", label: "Plastic bottles", material: "plastic", count: 70 }],
      quantity: 8,
      description: "",
      address: home.line,
      area: home.area,
      landmark: home.landmark,
      date: dateOnly(now - 12 * day),
      slot: "08:00 – 10:00",
      collectorId: "c-lamin",
      partnerId: "p-plastic",
      status: "verified",
      createdAt: iso(now - 14 * day),
      timeline: timeline(STATUS_FLOW, now - 14 * day, 9 * hour),
      coins: 400,
    },
    {
      id: "RMK-1027",
      collectionToken: "R3GV7PL2XE5WD9JN",
      kind: "recyclable",
      material: "metal",
      items: [{ id: "i1", label: "Drink cans", material: "metal", count: 120 }],
      quantity: 6,
      description: "",
      address: home.line,
      area: home.area,
      landmark: home.landmark,
      date: dateOnly(now - 22 * day),
      slot: "14:00 – 16:00",
      collectorId: "c-kombo",
      partnerId: "p-metal",
      status: "verified",
      createdAt: iso(now - 24 * day),
      timeline: timeline(STATUS_FLOW, now - 24 * day, 9 * hour),
      coins: 480,
    },
    {
      id: "RMK-1020",
      collectionToken: "Z6YB9HK4MT2QR7CF",
      kind: "general",
      material: "general",
      items: [],
      quantity: 3,
      description: "Clean-up after naming ceremony.",
      address: home.line,
      area: home.area,
      landmark: home.landmark,
      date: dateOnly(now - 30 * day),
      slot: "16:00 – 18:00",
      collectorId: "c-greenbelt",
      partnerId: null,
      status: "cancelled",
      createdAt: iso(now - 31 * day),
      timeline: [
        ...timeline(["submitted", "awaiting", "assigned"], now - 31 * day, 2 * hour),
        { status: "cancelled", at: iso(now - 30.5 * day), note: "Cancelled by you" },
      ],
      coins: 0,
      cancelReason: "Plans changed",
    },
  ];

  const transactions: Transaction[] = [
    {
      id: "t7",
      type: "earn",
      amount: 150,
      label: "Paper & cardboard · 5 bags",
      at: iso(now - day),
      status: "pending",
      pickupId: "RMK-1039",
    },
    {
      id: "t6",
      type: "redeem",
      amount: 1000,
      label: "Free delivery voucher",
      at: iso(now - 9 * day),
      status: "completed",
    },
    {
      id: "t5",
      type: "earn",
      amount: 400,
      label: "Plastic · 8 bags",
      at: iso(now - 12 * day),
      status: "completed",
      pickupId: "RMK-1031",
    },
    {
      id: "t4",
      type: "redeem",
      amount: 220,
      label: "Airtime D50",
      at: iso(now - 18 * day),
      status: "completed",
    },
    {
      id: "t3",
      type: "earn",
      amount: 480,
      label: "Metals & cans · 6 bags",
      at: iso(now - 22 * day),
      status: "completed",
      pickupId: "RMK-1027",
    },
    {
      id: "t2",
      type: "earn",
      amount: 880,
      label: "Plastic & glass · 3 pickups",
      at: iso(now - 35 * day),
      status: "completed",
    },
    {
      id: "t1",
      type: "bonus",
      amount: 100,
      label: "Welcome bonus",
      at: iso(now - 40 * day),
      status: "completed",
    },
  ];

  const redemptions: Redemption[] = [
    {
      id: "x2",
      rewardId: "r-delivery",
      name: "Free delivery",
      cost: 1000,
      at: iso(now - 9 * day),
      code: "RMK-FD-7731",
      status: "issued",
    },
    {
      id: "x1",
      rewardId: "r-airtime",
      name: "Airtime",
      cost: 220,
      at: iso(now - 18 * day),
      code: "RMK-AT-2290",
      status: "issued",
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: "n1",
      title: "Lamin is on the way",
      body: "Your plastic pickup RMK-1042 is on its way. Have your bags at the gate.",
      at: iso(now - 20 * 60 * 1000),
      read: false,
      kind: "pickup",
      link: "RMK-1042",
    },
    {
      id: "n2",
      title: "Pickup delayed",
      body: "Sahel Scrap Collectors are running about 45 minutes late for RMK-1044.",
      at: iso(now - 2 * hour),
      read: false,
      kind: "pickup",
      link: "RMK-1044",
    },
    {
      id: "n3",
      title: "150 coins pending",
      body: "Your cardboard is being weighed by the recycling partner.",
      at: iso(now - day),
      read: false,
      kind: "coins",
    },
    {
      id: "n4",
      title: "Voucher issued",
      body: "Your free delivery voucher RMK-FD-7731 is ready to use.",
      at: iso(now - 9 * day),
      read: true,
      kind: "reward",
    },
    {
      id: "n5",
      title: "Tip: flatten your boxes",
      body: "Flattened cardboard takes half the space in a bag.",
      at: iso(now - 11 * day),
      read: true,
      kind: "tip",
    },
  ];

  const work = collectorWork(now);
  return {
    hydrated: false,
    onboarded: false,
    signedIn: false,
    user: {
      name: "Ebrima Njie",
      phone: "7012345",
      email: "ebrima.njie@example.gm",
      area: "Bundung",
    },
    transactions,
    pickups: [...pickups, ...work.pickups],
    redemptions,
    notifications,
    addresses,
    language: "en",
    notificationPrefs: { pickups: true, coins: true, rewards: true, tips: false, sms: true },
    draft: emptyDraft(),
    demo: { offline: false, scanUnavailable: false, noCollectors: false },
    role: "resident",
    collectorAccount: null,
    collectorEdits: {},
    registeredCollectors: [],
    routes: work.routes,
    workNotifications: work.notifications,
    thresholds: { ...DEFAULT_THRESHOLDS },
  };
}

/** Fixed reference time used for server rendering, before the device's saved demo state loads. */
export const SSR_NOW = Date.UTC(2026, 10, 22, 9, 0, 0);

// ---------------------------------------------------------------------------------------------
// Collector-side sample work: institutional requests, routes, history and notifications.
// All institutions, people and quantities are illustrative.
// ---------------------------------------------------------------------------------------------

function inst(name: string, kind: string, contact: string, contactRole: string, phone: string): Institution {
  return { name, kind, contact, contactRole, phone };
}

const HISTORY_PLACES: [string, string, string][] = [
  ["Kanifing Estate Market", "Market", "Kanifing"],
  ["Brusubi Lower Basic School", "School", "Brusubi"],
  ["Serrekunda Health Centre", "Health centre", "Serrekunda"],
  ["Bakau Fish Market", "Market", "Bakau"],
  ["Kololi Palm Grove Hotel", "Hotel", "Kololi"],
  ["Bundung Youth Centre", "Community group", "Bundung"],
  ["Latrikunda Upper Basic School", "School", "Latrikunda"],
  ["Kotu Beach Restaurants Group", "Business", "Kotu"],
  ["Banjul Albert Market", "Market", "Banjul"],
  ["Brikama Craft Market", "Market", "Brikama"],
  ["Fajara Community Clinic", "Health centre", "Fajara"],
  ["Busumbala Women's Garden", "Community group", "Busumbala"],
];

export function collectorWork(now: number): {
  pickups: Pickup[];
  routes: CollectionRoute[];
  notifications: WorkNotification[];
} {
  const d = (offset: number) => dateOnly(now + offset * day);
  let n = 0;
  const make = (
    o: Partial<Pickup> & Pick<Pickup, "material" | "quantity" | "area"> & { institution: Institution },
  ): Pickup => {
    n++;
    const num = 2100 + n;
    const kind = RECYCLABLE.includes(o.material) || o.material === "organic" ? "recyclable" : "general";
    const status: PickupStatus = o.status ?? (o.collectorId ? "submitted" : "awaiting");
    const created = now - (8 + n) * hour;
    const upTo = STATUS_FLOW.indexOf(status);
    const flow = STATUS_FLOW.slice(0, upTo + 1).filter(
      (st) => !(st === "awaiting" && o.collectorId && status === "submitted"),
    );
    return {
      id: `REQ-${num}`,
      collectionToken: `RQ${String(num).padStart(6, "0")}K7HB8TWX`,
      kind,
      items: [],
      description: "",
      address: o.institution.name,
      landmark: "",
      date: d(1),
      slot: "10:00 – 12:00",
      collectorId: null,
      partnerId:
        kind === "recyclable" ? (PARTNERS.find((p) => p.accepts.includes(o.material))?.id ?? null) : null,
      status,
      createdAt: iso(created),
      timeline: flow.map((st, i) => ({ status: st, at: iso(created + i * hour) })),
      coins: 0,
      separated: true,
      ...o,
    };
  };

  const pickups: Pickup[] = [
    // Open requests — no collector yet. Who sees them depends on category, area and the routing rules.
    make({
      institution: inst("Bundung Upper Basic School", "School", "Mariama Bah", "Green Champion", "+220 702 1101"),
      material: "plastic", quantity: 6, estimatedKg: 26, area: "Bundung", address: "Bundung Six Junction",
      photo: MATERIAL_IMAGE.plastic, flexibleWindow: true, slot: "10:00 – 12:00",
    }),
    make({
      institution: inst("Serrekunda Market — Section B", "Market", "Ousman Darboe", "Market committee", "+220 702 1102"),
      material: "paper", quantity: 2, estimatedKg: 11, area: "Serrekunda", address: "Sayerr Jobe Avenue",
      awaitingMore: true, date: d(2),
    }),
    make({
      institution: inst("Latrikunda Health Centre", "Health centre", "Haddy Jobe", "Facility manager", "+220 702 1103"),
      material: "plastic", quantity: 1, area: "Latrikunda", address: "Latrikunda Sabiji Road", date: d(2),
    }),
    make({
      institution: inst("Bakau Lower Basic School", "School", "Lamin Ceesay", "Green Champion", "+220 702 1104"),
      material: "glass", quantity: 4, estimatedKg: 48, area: "Bakau", address: "Old Cape Road",
      readyFrom: d(3), date: d(1), photo: MATERIAL_IMAGE.glass,
    }),
    make({
      institution: inst("Kotu Beach Hotel", "Hotel", "Fatoumata Sowe", "Housekeeping lead", "+220 702 1105"),
      material: "general", quantity: 8, estimatedKg: 70, area: "Kotu", address: "Kotu Beach Road",
      slot: "08:00 – 10:00", photo: MATERIAL_IMAGE.general,
    }),
    make({
      institution: inst("Kololi Residents' Association", "Community group", "Alagie Jallow", "Chairperson", "+220 702 1106"),
      material: "mixed_plastic", quantity: 5, area: "Kololi", address: "Kololi Village Square",
    }),
    make({
      institution: inst("Fajara Clinic", "Health centre", "Dr. Amie Touray", "Clinic administrator", "+220 702 1107"),
      material: "general", quantity: 2, estimatedKg: 15, area: "Fajara", address: "Atlantic Boulevard",
    }),
    make({
      institution: inst("Brikama Area Council Clinic", "Health centre", "Ebrima Colley", "Store keeper", "+220 702 1108"),
      material: "special", quantity: 3, area: "Brikama", address: "Brikama Main Road",
      description: "Used batteries and old fluorescent tubes.",
    }),
    make({
      institution: inst("Kanifing Estate Mosque", "Community group", "Imam Ousainou Njie", "Mosque committee", "+220 702 1109"),
      material: "general", quantity: 3, area: "Kanifing", address: "Kanifing Estate, Block C",
    }),

    // Requests sent to a specific collector, waiting for them to accept.
    make({
      institution: inst("Brusubi Supermarket", "Business", "Yusupha Manneh", "Store manager", "+220 702 1110"),
      material: "metal", quantity: 3, estimatedKg: 24, area: "Brusubi", address: "Brusubi Turntable",
      collectorId: "c-kombo", slot: "14:00 – 16:00", flexibleWindow: true,
    }),
    make({
      institution: inst("Senegambia Craft Market", "Market", "Binta Saho", "Market secretary", "+220 702 1111"),
      material: "general", quantity: 6, estimatedKg: 50, area: "Kololi", address: "Senegambia Strip",
      collectorId: "c-greenbelt", slot: "08:00 – 10:00",
    }),
    make({
      institution: inst("Bundung Mosque Committee", "Community group", "Pa Alieu Sarr", "Treasurer", "+220 702 1112"),
      material: "plastic", quantity: 3, area: "Bundung", address: "Bundung Mosque Road",
      collectorId: "c-lamin", slot: "16:00 – 18:00",
    }),
    make({
      institution: inst("Fajara Golf Club", "Business", "Sheriff Bojang", "Facilities", "+220 702 1113"),
      material: "glass", quantity: 3, estimatedKg: 36, area: "Fajara", address: "Fajara Golf Course",
      collectorId: "c-modou", date: d(2),
    }),
    make({
      institution: inst("Latrikunda Sabiji Market", "Market", "Kumba Jatta", "Market committee", "+220 702 1114"),
      material: "general", quantity: 4, area: "Latrikunda", address: "Sabiji Market",
      collectorId: "c-kanifing",
    }),

    // Accepted, not yet on a route.
    make({
      institution: inst("Kololi Youth Centre", "Community group", "Musa Camara", "Coordinator", "+220 702 1115"),
      material: "plastic", quantity: 4, estimatedKg: 17, area: "Kololi", address: "Kololi Road",
      collectorId: "c-kombo", status: "assigned",
    }),
    make({
      institution: inst("Bakau Newtown Clinic", "Health centre", "Nyima Sanyang", "Facility manager", "+220 702 1116"),
      material: "plastic", quantity: 3, estimatedKg: 12, area: "Bakau", address: "Bakau Newtown",
      collectorId: "c-kombo", status: "assigned", slot: "08:00 – 10:00",
    }),
    make({
      institution: inst("Banjul Central Library", "Public office", "Ida Faye", "Librarian", "+220 702 1117"),
      material: "paper", quantity: 5, estimatedKg: 32, area: "Banjul", address: "Independence Drive",
      collectorId: "c-kombo", status: "assigned", date: d(2),
    }),
    make({
      institution: inst("Brusubi Phase 2 Estate", "Residential estate", "Saikou Drammeh", "Estate manager", "+220 702 1118"),
      material: "general", quantity: 7, estimatedKg: 60, area: "Brusubi", address: "Phase 2, Block 4",
      collectorId: "c-greenbelt", status: "assigned", slot: "08:00 – 10:00",
    }),
    make({
      institution: inst("Brusubi Turntable Stores", "Business", "Adama Kinteh", "Shop owner", "+220 702 1119"),
      material: "general", quantity: 5, estimatedKg: 42, area: "Brusubi", address: "Brusubi Turntable",
      collectorId: "c-greenbelt", status: "assigned",
    }),
    make({
      institution: inst("Latrikunda German School", "School", "Momodou Fofana", "Head teacher", "+220 702 1120"),
      material: "general", quantity: 4, area: "Latrikunda", address: "Latrikunda German",
      collectorId: "c-kanifing", status: "assigned", date: d(0), slot: "14:00 – 16:00",
    }),
    make({
      institution: inst("Latrikunda Sabiji Lower Basic", "School", "Aji Kaddy Jobe", "Green Champion", "+220 702 1121"),
      material: "plastic", quantity: 3, area: "Latrikunda", address: "Sabiji",
      collectorId: "c-lamin", status: "assigned", date: d(0), slot: "14:00 – 16:00",
    }),
    make({
      institution: inst("Fajara Barracks Canteen", "Public office", "Sgt. Lamin Badjie", "Canteen manager", "+220 702 1122"),
      material: "glass", quantity: 2, estimatedKg: 24, area: "Fajara", address: "Fajara Barracks",
      collectorId: "c-modou", status: "assigned", date: d(0),
    }),

    // On today's routes.
    make({
      institution: inst("Bundung Women's Garden", "Community group", "Ya Fatou Ceesay", "Group leader", "+220 702 1123"),
      material: "plastic", quantity: 4, estimatedKg: 16, area: "Bundung", address: "Bundung Borehole",
      collectorId: "c-kombo", status: "assigned", date: d(0), slot: "08:00 – 10:00", routeId: "rt-301",
    }),
    make({
      institution: inst("Serrekunda Lower Basic School", "School", "Ebrima Sanneh", "Green Champion", "+220 702 1124"),
      material: "plastic", quantity: 5, estimatedKg: 21, area: "Serrekunda", address: "London Corner",
      collectorId: "c-kombo", status: "assigned", date: d(0), slot: "10:00 – 12:00", routeId: "rt-301",
    }),
    make({
      institution: inst("Serrekunda Police Barracks", "Public office", "Cpl. Awa Jammeh", "Welfare officer", "+220 702 1125"),
      material: "plastic", quantity: 3, estimatedKg: 13, area: "Serrekunda", address: "Serrekunda Police Station",
      collectorId: "c-kombo", status: "assigned", date: d(0), slot: "10:00 – 12:00", routeId: "rt-301",
    }),
    make({
      institution: inst("Kololi Beach Hotel", "Hotel", "Omar Jeng", "Operations", "+220 702 1126"),
      material: "general", quantity: 10, estimatedKg: 85, area: "Kololi", address: "Bertil Harding Highway",
      collectorId: "c-greenbelt", status: "collected", date: d(0), slot: "08:00 – 10:00", routeId: "rt-302",
      collectedAt: iso(now - 90 * 60 * 1000), collectedBy: "c-greenbelt",
    }),
    make({
      institution: inst("Kotu Craft Market", "Market", "Isatou Bah", "Market secretary", "+220 702 1127"),
      material: "general", quantity: 6, estimatedKg: 48, area: "Kotu", address: "Kotu Bridge",
      collectorId: "c-greenbelt", status: "on_the_way", date: d(0), slot: "08:00 – 10:00", routeId: "rt-302",
    }),
    make({
      institution: inst("Bakau Fish Landing", "Market", "Modou Lamin Faye", "Landing site committee", "+220 702 1128"),
      material: "mixed_plastic", quantity: 8, estimatedKg: 40, area: "Bakau", address: "Bakau Fish Landing Site",
      collectorId: "c-greenbelt", status: "assigned", date: d(0), slot: "10:00 – 12:00", routeId: "rt-302",
    }),

    // Collected by a recycling company, waiting for its material verification.
    make({
      institution: inst("Palm Grove Hotel", "Hotel", "Rohey Secka", "Purchasing", "+220 702 1129"),
      material: "glass", quantity: 6, estimatedKg: 70, area: "Kololi", address: "Kololi Hotel Strip",
      collectorId: "c-kombo", status: "collected", date: d(-1), collectedAt: iso(now - 20 * hour),
      collectedBy: "c-kombo",
    }),
  ];

  // Past work, for history and performance charts.
  const historyFor = [
    "c-kombo", "c-greenbelt", "c-kanifing", "c-lamin", "c-modou", "c-rebottle", "c-sahel", "c-compost", "c-fatou",
  ];
  historyFor.forEach((cid, ci) => {
    const c = COLLECTORS.find((x) => x.id === cid)!;
    const mats = c.accepts.filter((m) => m !== "special");
    for (let i = 0; i < 11; i++) {
      const [name, kind, area] = HISTORY_PLACES[(i + ci * 3) % HISTORY_PLACES.length]!;
      const material = mats[(i + ci) % mats.length]!;
      const quantity = 2 + ((i * 5 + ci) % 7);
      const when = now - (2 + i * 3.6 + (ci % 3)) * day;
      const recyclable = RECYCLABLE.includes(material) || material === "organic";
      const base = make({
        institution: inst(name, kind, "Green Champion", "Contact", "+220 702 1199"),
        material, quantity, area, date: dateOnly(when), estimatedKg: quantity * KG_PER_BAG[material],
        createdAt: iso(when - 2 * day),
      });
      let p: Pickup;
      if (i % 7 === 3) {
        p = {
          ...base, collectorId: cid, status: "cancelled", cancelReason: "Missed collection — rebooked",
          issues: [{ kind: "missed", collectorId: cid, note: "Gate locked on arrival", at: iso(when) }],
          timeline: [{ status: "submitted", at: iso(when - 2 * day) }, { status: "cancelled", at: iso(when) }],
        };
      } else if (i % 7 === 5) {
        p = {
          ...base, status: "cancelled", cancelReason: "Requester withdrew",
          declined: [{ collectorId: cid, reason: "Vehicle full for that day", at: iso(when - day) }],
          timeline: [{ status: "submitted", at: iso(when - 2 * day) }, { status: "cancelled", at: iso(when) }],
        };
      } else {
        const actualKg = Math.round(quantity * KG_PER_BAG[material] * (0.85 + ((i * 7) % 3) / 10));
        const result = !recyclable ? null : i === 8 ? "needs_sorting" : i === 10 ? "rejected" : "accepted";
        p = {
          ...base, collectorId: cid, collectedBy: cid, collectedAt: iso(when),
          status: result === "accepted" ? "verified" : "collected",
          timeline: timeline(STATUS_FLOW.slice(0, result === "accepted" ? 6 : 5), when - 2 * day, 9 * hour),
        };
        if (result) {
          p.verification = {
            by: c.category === "recycling" ? cid : (base.partnerId ?? cid),
            at: iso(when + 5 * hour),
            received: true,
            actualKg,
            meetsRequirements: result === "accepted",
            needsSorting: result === "needs_sorting",
            result,
            ...(result === "rejected" && { note: "Bags contained food waste." }),
            ...(result === "needs_sorting" && { note: "Some caps and labels mixed in." }),
          };
        }
      }
      pickups.push(p);
    }
  });

  const routes: CollectionRoute[] = [
    {
      id: "rt-301",
      ref: "RT-301",
      name: "Kanifing zone · Kombo Plastics Recovery",
      collectorId: "c-kombo",
      zone: "KAN",
      date: d(0),
      window: "08:00 – 12:00",
      status: "planned",
      stops: [
        { pickupId: "REQ-2123", state: "pending" },
        { pickupId: "REQ-2124", state: "pending" },
        { pickupId: "REQ-2125", state: "pending" },
      ],
      createdAt: iso(now - day),
    },
    {
      id: "rt-302",
      ref: "RT-302",
      name: "Coastal zone · General waste",
      collectorId: "c-greenbelt",
      zone: "CST",
      date: d(0),
      window: "08:00 – 12:00",
      status: "in_progress",
      stops: [
        { pickupId: "REQ-2126", state: "collected", at: iso(now - 90 * 60 * 1000) },
        { pickupId: "REQ-2127", state: "arrived", at: iso(now - 10 * 60 * 1000) },
        { pickupId: "REQ-2128", state: "pending" },
      ],
      createdAt: iso(now - day),
    },
  ];

  const note = (
    id: string, collectorId: string, kind: WorkNotification["kind"], title: string, body: string,
    minsAgo: number, link?: WorkNotification["link"],
  ): WorkNotification => ({
    id, collectorId, kind, title, body, at: iso(now - minsAgo * 60 * 1000), read: minsAgo > 600,
    ...(link && { link }),
  });

  const notifications: WorkNotification[] = [
    note("w1", "c-kombo", "request", "New request: Brusubi Supermarket", "3 bags of metal & cans · tomorrow 14:00 – 16:00", 25, { to: "request", id: "REQ-2110" }),
    note("w2", "c-kombo", "route", "Route RT-301 ready", "3 stops in Kanifing zone today · 12 bags", 180, { to: "route", id: "rt-301" }),
    note("w3", "c-kombo", "verification", "Verification due", "Palm Grove Hotel glass was collected yesterday. Record the material check.", 400, { to: "request", id: "REQ-2129" }),
    note("w4", "c-kombo", "schedule", "Window agreed", "Kololi Youth Centre agreed to tomorrow 10:00 – 12:00.", 1500, { to: "request", id: "REQ-2115" }),
    note("w5", "c-greenbelt", "request", "New assignment: Senegambia Craft Market", "6 bags of general waste · tomorrow 08:00 – 10:00", 40, { to: "request", id: "REQ-2111" }),
    note("w6", "c-greenbelt", "confirmation", "Collection confirmed", "Kololi Beach Hotel · 10 bags collected on RT-302.", 90, { to: "route", id: "rt-302" }),
    note("w7", "c-greenbelt", "reminder", "Capacity check", "Tomorrow's assignments use 12 of 120 bags.", 900),
    note("w8", "c-lamin", "request", "New job offer: Bundung Mosque Committee", "3 bags of plastic · tomorrow 16:00 – 18:00", 35, { to: "request", id: "REQ-2112" }),
    note("w9", "c-lamin", "upcoming", "Pickup today", "RMK-1042 in Bundung · 10:00 – 12:00. Scan the resident's QR on arrival.", 120),
    note("w10", "c-modou", "request", "New job offer: Fajara Golf Club", "3 bags of glass · in 2 days", 50, { to: "request", id: "REQ-2113" }),
    note("w11", "c-modou", "request", "Fallback request: Fajara Clinic", "No private company serves Fajara, so this general-waste request is offered to you.", 70, { to: "request", id: "REQ-2107" }),
    note("w12", "c-kanifing", "request", "New assignment: Latrikunda Sabiji Market", "4 bags of general waste · tomorrow", 30, { to: "request", id: "REQ-2114" }),
    note("w13", "c-rebottle", "request", "Accumulating request nearby", "Latrikunda Health Centre has 1 of 3 bags so far.", 60, { to: "request", id: "REQ-2103" }),
  ];

  return { pickups, routes, notifications };
}
