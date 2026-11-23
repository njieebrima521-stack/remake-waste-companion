import {
  BatteryWarning,
  BookOpen,
  Cylinder,
  Droplets,
  Gift,
  Leaf,
  Milk,
  Newspaper,
  PackageX,
  ShoppingBag,
  Smartphone,
  Trash2,
  Truck,
  Wine,
  type LucideIcon,
} from "lucide-react";

import type { CollectorType, MaterialId, Reward } from "@/lib/remake/types";

export const MATERIAL_ICON: Record<MaterialId, LucideIcon> = {
  plastic: Milk,
  mixed_plastic: PackageX,
  paper: Newspaper,
  glass: Wine,
  metal: Cylinder,
  organic: Leaf,
  general: Trash2,
  special: BatteryWarning,
};

export const REWARD_ICON: Record<Reward["icon"], LucideIcon> = {
  gift: Gift,
  phone: Smartphone,
  truck: Truck,
  bag: ShoppingBag,
  book: BookOpen,
  droplet: Droplets,
  trash: Trash2,
};

export const COLLECTOR_TYPE_LABEL: Record<CollectorType, string> = {
  donkey_cart: "Donkey-cart operator",
  company: "Private waste company",
  tricycle: "Clean-up crew",
  recycler: "Recycling organisation",
};
