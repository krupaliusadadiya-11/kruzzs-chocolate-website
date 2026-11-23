// Downloads the chosen Unsplash photos (Unsplash License) from the public CDN,
// converts them to two WebP sizes and writes width/height metadata so every
// <img> can reserve its box (no layout shift). Run: npm run images
import fs from "node:fs";
import sharp from "sharp";

const map = JSON.parse(fs.readFileSync("tools/images.json", "utf8"));
fs.mkdirSync("public/img", { recursive: true });
fs.mkdirSync("assets/src", { recursive: true });
const meta = {};

await Promise.all(
  Object.entries(map).map(async ([name, [id, by, [big, small]]]) => {
    const src = `assets/src/${name}.jpg`;
    if (!fs.existsSync(src)) {
      const r = await fetch(`https://images.unsplash.com/photo-${id}?w=2000&q=85&fm=jpg`);
      if (!r.ok) throw new Error(`${name} ${r.status}`);
      fs.writeFileSync(src, Buffer.from(await r.arrayBuffer()));
    }
    const m = await sharp(src).metadata();
    for (const [w, suf] of [[big, ""], [small, "-s"]]) {
      await sharp(src).resize({ width: Math.min(w, m.width) }).webp({ quality: 76, effort: 5 }).toFile(`public/img/${name}${suf}.webp`);
    }
    meta[name] = { w: m.width, h: m.height, by, id, bw: Math.min(big, m.width), sw: Math.min(small, m.width) };
  }),
);

fs.writeFileSync("src/images-meta.json", JSON.stringify(meta, null, 1));
let total = 0;
for (const f of fs.readdirSync("public/img")) total += fs.statSync("public/img/" + f).size;
console.log(Object.keys(meta).length, "images,", (total / 1e6).toFixed(2), "MB");

const rows = Object.entries(map)
  .map(([n, [id, by]]) => `| ${n} | ${by} | https://images.unsplash.com/photo-${id} |`)
  .join("\n");
fs.writeFileSync(
  "CREDITS.md",
  `# Photo credits\n\nAll photographs are from [Unsplash](https://unsplash.com) under the [Unsplash License](https://unsplash.com/license) (free for commercial use; credit given as a courtesy). They are stand-in product photography for a fictional brand — not real KRUZZ'S products.\n\n| File | Photographer | Source |\n|---|---|---|\n${rows}\n\nAll 3D objects (chocolate bar, pieces, nuts, melt sheet, gift box) are procedural Three.js geometry written for this project — no third-party models.\n`,
);
