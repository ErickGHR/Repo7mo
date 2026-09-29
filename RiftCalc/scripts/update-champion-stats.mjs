import fs from "node:fs/promises";
const riot = JSON.parse(await fs.readFile("src/data/riot.json", "utf8"));
const version = riot.patch.split(".").slice(0, 2).join(".");
const source = `https://raw.communitydragon.org/${version}/game/data/characters/`;
const ids = Object.keys(riot.champions).sort(),
  records = {};
let cursor = 0;
// Cache is only used when explicitly requested, and must match the snapshot patch.
if (process.argv.includes("--from-reference")) {
  const cached = JSON.parse(
    await fs.readFile("scripts/champion-stats-reference.json", "utf8"),
  );
  if (cached.patch !== riot.patch)
    throw Error("Parche de evidencia incompatible");
  Object.assign(records, cached.records);
} else {
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (cursor < ids.length) {
        const id = ids[cursor++],
          lower = id.toLowerCase();
        const response = await fetch(`${source}${lower}/${lower}.bin.json`, {
          signal: AbortSignal.timeout(45000),
        });
        if (!response.ok) throw Error(`${id}: HTTP ${response.status}`);
        const data = await response.json();
        records[id] = Object.entries(data).find(
          ([key]) =>
            key.toLowerCase() === `characters/${lower}/characterrecords/root`,
        )?.[1];
      }
    }),
  );
}
const champions = {};
for (const id of ids) {
  const root = records[id];
  if (!root) throw Error(`Falta registro: ${id}`);
  // Senna has no native AD growth; soul stacks are outside the base-stat model.
  const growth =
    root.damagePerLevelModifiable?.baseValue ??
    (id === "Senna" ? 0 : undefined);
  const ratio = root.attackSpeedRatioModifiable?.baseValue;
  if (![growth, ratio].every((value) => Number.isFinite(value) && value >= 0))
    throw Error(`Estadísticas inválidas: ${id}`);
  champions[id] = { attackdamageperlevel: growth, attackspeedratio: ratio };
}
// Only replace the snapshot after every champion has passed validation.
await fs.writeFile(
  "src/data/stat-overrides.json",
  JSON.stringify(
    {
      patch: riot.patch,
      source,
      record: "CharacterRecords/Root",
      notes:
        "Senna: crecimiento AD base 0; Jhin: ratio AS 0. Pasivas, acumulaciones y transformaciones no incluidas.",
      champions,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Estadísticas verificadas: ${ids.length} campeones, parche ${riot.patch}.`,
);
