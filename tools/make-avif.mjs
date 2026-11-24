// Adds AVIF siblings for every photo, encoded from the original JPEGs in assets/src
// (never re-encoded from the WebPs, so there is no generation loss). Same two widths
// as the WebP set; browsers without AVIF keep using the WebP files.
import fs from "node:fs";
import sharp from "sharp";

const meta = JSON.parse(fs.readFileSync("src/images-meta.json", "utf8"));
let before = 0;
let after = 0;
for (const [name, m] of Object.entries(meta)) {
  const src = `assets/src/${name}.jpg`;
  if (!fs.existsSync(src)) continue;
  for (const [suf, w] of [["", m.bw], ["-s", m.sw]]) {
    const out = `public/img/${name}${suf}.avif`;
    await sharp(src).resize({ width: w }).avif({ quality: 55, effort: 5, chromaSubsampling: "4:4:4" }).toFile(out);
    before += fs.statSync(`public/img/${name}${suf}.webp`).size;
    after += fs.statSync(out).size;
  }
}
console.log(`webp ${(before / 1024).toFixed(0)} KB → avif ${(after / 1024).toFixed(0)} KB`);
