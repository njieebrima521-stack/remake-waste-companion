import catGeneral from "@/assets/cat-general.jpg";
import catGlass from "@/assets/cat-glass.jpg";
import catMetal from "@/assets/cat-metal.jpg";
import catOrganic from "@/assets/cat-organic.jpg";
import catPaper from "@/assets/cat-paper.jpg";
import catPlastic from "@/assets/cat-plastic.jpg";
import catSpecial from "@/assets/cat-special.jpg";
import onboardPickup from "@/assets/onboard-pickup.jpg";
import onboardRewards from "@/assets/onboard-rewards.jpg";
import onboardWelcome from "@/assets/onboard-welcome.jpg";
import scanMixed from "@/assets/scan-mixed.jpg";

import type { MaterialId, SceneId } from "./types";

export const MATERIAL_IMAGE: Record<MaterialId, string> = {
  plastic: catPlastic,
  mixed_plastic: catGeneral,
  paper: catPaper,
  glass: catGlass,
  metal: catMetal,
  organic: catOrganic,
  general: catGeneral,
  special: catSpecial,
};

export const SCENE_IMAGE: Record<Exclude<SceneId, "upload">, string> = {
  mixed: scanMixed,
  plastic: catPlastic,
  cans: catMetal,
  blurry: scanMixed,
};

export const ONBOARDING_IMAGES = {
  welcome: onboardWelcome,
  pickup: onboardPickup,
  rewards: onboardRewards,
};
export { scanMixed, catGeneral };
