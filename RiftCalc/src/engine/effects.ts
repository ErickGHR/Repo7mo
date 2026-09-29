import { ItemEffect } from "./types";
/** Manually maintained, versioned models; see design/SOURCES.md. */
export const EFFECT_PATCH = "16.19.1";
export const itemEffects: Record<string, ItemEffect> = {
  "3115": {
    id: "3115",
    name: "Mordida de Icathia",
    trigger: "on-hit",
    damageType: "magic",
    cooldown: 0,
    calculate: (s) => 15 + 0.15 * s.ap,
  },
  "6655": {
    id: "6655",
    name: "Eco de Luden · 6 cargas, objetivo aislado",
    trigger: "on-spell",
    damageType: "magic",
    cooldown: 12,
    calculate: (s) => 2 * (75 + 0.05 * s.ap),
  },
  "3057": {
    id: "3057",
    name: "Brillo · Espada Encantada",
    trigger: "on-hit",
    damageType: "physical",
    cooldown: 1.5,
    calculate: (s) => s.baseAd,
  },
};
export const modeledItems = ["3115", "6655", "3057", "3089", "3135", "3020"];
