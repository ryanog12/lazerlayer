// Regenerates raster brand assets. Run: node scripts/build-brand-assets.mjs
//   public/brand/lazerlayer-logo-source.png  original full logo (raster, used for the OG/Twitter banner)
//   src/app/icon.svg                         vector favicon (hand-made recreation of the hexagon mark)
import sharp from "sharp";

const src = "public/brand/lazerlayer-logo-source.png";
const { width, height } = await sharp(src).metadata();

// Source has a UI artifact along the top edge and a light line on the right edge.
const clean = await sharp(src).extract({ left: 0, top: 18, width: width - 8, height: height - 18 }).png().toBuffer();
await sharp(clean).toFile("public/brand/lazerlayer-logo.png");

await sharp("src/app/icon.svg", { density: 300 }).resize(180, 180).png().toFile("src/app/apple-icon.png");

// Extends the logo's own background edges horizontally so the banner has no visible seam.
async function banner(w, h, out) {
  const logo = await sharp(clean).resize({ height: h }).png().toBuffer();
  const { width: lw } = await sharp(logo).metadata();
  const pad = Math.round((w - lw) / 2);
  await sharp(logo).extend({ left: pad, right: w - lw - pad, extendWith: "copy" }).png().toFile(out);
}
await banner(1200, 630, "src/app/opengraph-image.png");
await banner(1200, 630, "src/app/twitter-image.png");
