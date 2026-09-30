import fs from "node:fs/promises";
const riot = JSON.parse(await fs.readFile("src/data/riot.json", "utf8"));
const version = riot.patch.split(".").slice(0, 2).join(".");
const ids = Object.keys(riot.champions).sort();
await fs.mkdir("scripts/ability-cache", { recursive: true });
let cursor = 0,
  count = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (cursor < ids.length) {
      const id = ids[cursor++];
      const lower = id.toLowerCase();
      for (const [kind, url] of [
        [
          "bin",
          `https://raw.communitydragon.org/${version}/game/data/characters/${lower}/${lower}.bin.json`,
        ],
        [
          "detail",
          `https://ddragon.leagueoflegends.com/cdn/${riot.patch}/data/${riot.locale}/champion/${id}.json`,
        ],
      ]) {
        const path = `scripts/ability-cache/${riot.patch}-${id}-${kind}.json`;
        try {
          const cached = JSON.parse(await fs.readFile(path, "utf8"));
          if (
            kind === "detail"
              ? cached.version !== riot.patch || !cached.data?.[id]
              : !Object.keys(cached).some(
                  (k) =>
                    k.toLowerCase() ===
                    `characters/${lower}/characterrecords/root`,
                )
          )
            throw Error("Caché incompatible");
          continue;
        } catch {}
        let error;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
            if (!r.ok) throw Error(`${r.status} ${url}`);
            const data = await r.json();
            await fs.writeFile(path, JSON.stringify(data));
            error = null;
            break;
          } catch (e) {
            error = e;
          }
        }
        if (error) throw error;
      }
      count++;
      if (count % 25 === 0) console.log(`${count}/${ids.length}`);
    }
  }),
);
console.log("Descarga completa, parche " + riot.patch);
