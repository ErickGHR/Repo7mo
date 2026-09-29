// Regenerate evidence for the reviewed patch. Does not automatically approve a new patch.
import fs from "node:fs/promises";
const riot = JSON.parse(await fs.readFile("src/data/riot.json", "utf8"));
const patch = riot.patch,
  version = patch.split(".").slice(0, 2).join(".");
const get = async (path) => {
  const r = await fetch(
    `https://raw.communitydragon.org/${version}/game/${path}`,
  );
  if (!r.ok) throw Error(`${r.status}: ${path}`);
  return r.json();
};
const models = {
  patch,
  source: `https://raw.communitydragon.org/${version}/game/data/characters/`,
  champions: {},
};
const overrides = { patch, champions: {} };
for (const id of ["Ahri", "Jinx", "Garen"]) {
  const d = await get(
    `data/characters/${id.toLowerCase()}/${id.toLowerCase()}.bin.json`,
  );
  models.champions[id] = {};
  for (const a of ["Q", "W", "E", "R"]) {
    const s = d[`Characters/${id}/Spells/${id}${a}Ability/${id}${a}`].mSpell;
    models.champions[id][a] = {
      values: Object.fromEntries(
        (s.DataValues || []).map((v) => [v.name, v.values || []]),
      ),
      calculations: s.mSpellCalculations || {},
    };
  }
  const r = d[`Characters/${id}/CharacterRecords/Root`];
  overrides.champions[id] = {
    attackdamageperlevel: r.damagePerLevelModifiable.baseValue,
    attackspeedratio: r.attackSpeedRatioModifiable.baseValue,
  };
}
const [items, shared] = await Promise.all([
  get("items.cdtb.bin.json"),
  get("shared.cdtb.bin.json"),
]);
const effects = {
  patch,
  items: Object.fromEntries(
    ["3115", "6655", "3057", "3089"].map((id) => [
      id,
      {
        values: items[`Items/${id}`].mDataValues,
        calculations: items[`Items/${id}`].mItemCalculations,
      },
    ]),
  ),
  dragons: Object.fromEntries(
    ["Infernal", "Mountain", "Hextech"].map((id) => [
      id,
      shared[`Shared/Spells/SRX_DragonBuff${id}`].mSpell.DataValues,
    ]),
  ),
};
for (const [name, data] of Object.entries({
  models: models,
  "stat-overrides": overrides,
  "effect-reference": effects,
}))
  await fs.writeFile(`src/data/${name}.json`, JSON.stringify(data, null, 2));
console.log(
  "Evidencia regenerada. Revisar diff y ejecutar pruebas antes de aprobar cambios.",
);
