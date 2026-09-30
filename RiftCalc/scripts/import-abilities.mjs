import fs from "node:fs/promises";
import { createHash } from "node:crypto";
const riot = JSON.parse(await fs.readFile("src/data/riot.json", "utf8"));
const champions = {};
for (const id of Object.keys(riot.champions).sort()) {
  const raw = await fs.readFile(
    `scripts/ability-cache/${riot.patch}-${id}-bin.json`,
    "utf8",
  );
  const bin = JSON.parse(raw);
  const detail = JSON.parse(
    await fs.readFile(
      `scripts/ability-cache/${riot.patch}-${id}-detail.json`,
      "utf8",
    ),
  );
  if (detail.version !== riot.patch || !detail.data[id])
    throw Error(`Parche o campeón incorrecto: ${id}`);
  const root = Object.entries(bin).find(
    ([key]) =>
      key.toLowerCase() ===
      `characters/${id.toLowerCase()}/characterrecords/root`,
  )?.[1];
  if (!root || root.spells?.length !== 4)
    throw Error(`Faltan habilidades: ${id}`);
  const d = detail.data[id];
  const spells = {};
  for (const [path, entry] of Object.entries(bin)) {
    const spell = entry.mSpell;
    if (!spell) continue;
    if (
      !spell.mSpellCalculations &&
      !spell.DataValues &&
      !root.spells.includes(path) &&
      root.mCharacterPassiveSpell !== path
    )
      continue;
    spells[path] = {
      values: Object.fromEntries(
        (spell.DataValues || []).map((v) => [
          v.name,
          v.values || [0, 0, 0, 0, 0, 0, 0],
        ]),
      ),
      calculations: spell.mSpellCalculations || {},
      effects: spell.mEffectAmount || [],
    };
  }
  champions[id] = {
    name: d.name,
    passive: { ...d.passive, path: root.mCharacterPassiveSpell || null },
    abilities: d.spells.map((s, i) => ({
      key: ["Q", "W", "E", "R"][i],
      id: s.id,
      name: s.name,
      description: s.description,
      image: s.image,
      maxrank: s.maxrank,
      path: root.spells[i],
    })),
    spells,
    sourceHash: createHash("sha256").update(raw).digest("hex"),
  };
}
await fs.writeFile(
  "src/data/abilities.json",
  JSON.stringify({
    patch: riot.patch,
    source: `https://raw.communitydragon.org/${riot.patch.split(".").slice(0, 2).join(".")}/game/data/characters/`,
    champions,
  }),
);
console.log(
  `${Object.keys(champions).length} campeones importados; ${Object.values(champions).reduce((n, c) => n + Object.keys(c.spells).length, 0)} registros de habilidades.`,
);
