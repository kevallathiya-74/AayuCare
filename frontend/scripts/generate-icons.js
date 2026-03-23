/**
 * AayuCare - Icon & Splash Generator
 * Generates production-ready app icons from the existing logo.
 *
 * Usage: node scripts/generate-icons.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const LOGO = path.join(ROOT, "assets", "images", "aayucare-logo.png");
const OUT_DIR = path.join(ROOT, "assets", "icons");

const TEAL = { r: 0, g: 172, b: 193, alpha: 1 }; // #00ACC1

// Ensure output folder exists
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log("📁 Created assets/icons/");
}

/**
 * Build a flat teal background PNG buffer of the given size.
 */
const tealBackground = (size) =>
  sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: TEAL,
    },
  })
    .png()
    .toBuffer();

/**
 * Resize the logo to `logoSize` then composite it centered on a
 * `canvasSize x canvasSize` background (teal or transparent).
 *
 * @param {object} opts
 * @param {number} opts.canvasSize   - output PNG dimension
 * @param {number} opts.logoSize     - size to scale logo to (square)
 * @param {boolean} opts.transparent - use transparent bg (adaptive icon)
 */
async function compositeIcon({ canvasSize, logoSize, transparent }) {
  const offset = Math.round((canvasSize - logoSize) / 2);

  // Resize the source logo
  const resizedLogo = await sharp(LOGO)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  if (transparent) {
    // Transparent canvas
    const canvas = sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });
    return canvas
      .composite([{ input: resizedLogo, top: offset, left: offset }])
      .png()
      .toBuffer();
  } else {
    // Teal canvas
    const bg = await tealBackground(canvasSize);
    return sharp(bg)
      .composite([{ input: resizedLogo, top: offset, left: offset }])
      .png()
      .toBuffer();
  }
}

async function main() {
  console.log("🎨 Generating AayuCare icons...\n");

  // ------------------------------------------------------------------
  // app-icon.png  1024x1024 — teal bg, logo centred at 70% of canvas
  // ------------------------------------------------------------------
  {
    const canvas = 1024;
    const logoSize = Math.round(canvas * 0.70); // 717px logo, teal border padding
    const buf = await compositeIcon({ canvasSize: canvas, logoSize, transparent: false });
    const dest = path.join(OUT_DIR, "app-icon.png");
    fs.writeFileSync(dest, buf);
    console.log("✅ app-icon.png       (1024×1024, teal bg)");
  }

  // ------------------------------------------------------------------
  // adaptive-icon.png  1024x1024 — transparent bg, logo at 80% (safe zone)
  // ------------------------------------------------------------------
  {
    const canvas = 1024;
    const logoSize = Math.round(canvas * 0.80); // 819px — fits Android safe zone
    const buf = await compositeIcon({ canvasSize: canvas, logoSize, transparent: true });
    const dest = path.join(OUT_DIR, "adaptive-icon.png");
    fs.writeFileSync(dest, buf);
    console.log("✅ adaptive-icon.png  (1024×1024, transparent bg)");
  }

  // ------------------------------------------------------------------
  // ios-icon.png  1024x1024 — teal bg, logo at 70% (no rounded corners needed — iOS clips)
  // ------------------------------------------------------------------
  {
    const canvas = 1024;
    const logoSize = Math.round(canvas * 0.70);
    const buf = await compositeIcon({ canvasSize: canvas, logoSize, transparent: false });
    const dest = path.join(OUT_DIR, "ios-icon.png");
    fs.writeFileSync(dest, buf);
    console.log("✅ ios-icon.png       (1024×1024, teal bg)");
  }

  // ------------------------------------------------------------------
  // splash.png  2000x2000 — teal bg, logo at 50% (wide margins for all screen ratios)
  // ------------------------------------------------------------------
  {
    const canvas = 2000;
    const logoSize = Math.round(canvas * 0.50); // 1000px logo centred on 2000px canvas
    const buf = await compositeIcon({ canvasSize: canvas, logoSize, transparent: false });
    const dest = path.join(OUT_DIR, "splash.png");
    fs.writeFileSync(dest, buf);
    console.log("✅ splash.png         (2000×2000, teal bg)");
  }

  console.log("\n🎉 All icons generated in assets/icons/");
}

main().catch((err) => {
  console.error("❌ Icon generation failed:", err.message);
  process.exit(1);
});
