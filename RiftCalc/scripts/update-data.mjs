const fs = await import("node:fs/promises");
const get = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw Error(`${r.status} ${url}`);
  return r.json();
};
const versions = await get(
  "https://ddragon.leagueoflegends.com/api/versions.json",
);
const patch = process.argv[2] || versions[0];
if (!versions.includes(patch)) throw Error("Parche inexistente");
const models = JSON.parse(await fs.readFile("src/data/models.json", "utf8"));
if (patch !== models.patch)
  throw Error(
    `Hay datos ${patch}, pero el motor está revisado para ${models.patch}. Revisa y actualiza modelos, efectos y pruebas antes de reemplazar el snapshot. No se han modificado datos.`,
  );
const languages = await get(
  "https://ddragon.leagueoflegends.com/cdn/languages.json",
);
const locale = languages.includes("es_MX") ? "es_MX" : "en_US";
const base = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/${locale}`;
const [champions, items, runes] = await Promise.all(
  ["champion.json", "item.json", "runesReforged.json"].map((p) =>
    get(`${base}/${p}`),
  ),
);
const details = Object.fromEntries(
  await Promise.all(
    ["Ahri", "Jinx", "Garen"].map(async (id) => [
      id,
      (await get(`${base}/champion/${id}.json`)).data[id],
    ]),
  ),
);
await fs.writeFile(
  "src/data/riot.json",
  JSON.stringify(
    {
      patch,
      locale,
      retrievedAt: new Date().toISOString(),
      champions: champions.data,
      items: items.data,
      runes,
      details,
    },
    null,
    2,
  ),
);
console.log(
  `Data Dragon ${patch}, ${locale}: ${Object.keys(champions.data).length} campeones`,
);
