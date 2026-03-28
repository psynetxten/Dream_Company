/**
 * 꿈신문사 앱 아이콘 자동 생성 스크립트
 * 실행: node generate-icons.mjs
 * 필요: npm install sharp (일회성)
 */
import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, "public", "icon.svg");
const outDir = join(__dirname, "public", "icons");

mkdirSync(outDir, { recursive: true });

const svg = readFileSync(svgPath);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log("🗞  꿈신문사 앱 아이콘 생성 중...\n");

for (const size of sizes) {
  const outPath = join(outDir, `icon-${size}.png`);
  await sharp(svg)
    .resize(size, size)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outPath);
  console.log(`  ✓ icon-${size}.png`);
}

// Apple Touch Icon (180x180)
await sharp(svg)
  .resize(180, 180)
  .png({ quality: 100 })
  .toFile(join(__dirname, "public", "apple-touch-icon.png"));
console.log("  ✓ apple-touch-icon.png");

// Favicon 32x32
await sharp(svg)
  .resize(32, 32)
  .png({ quality: 100 })
  .toFile(join(__dirname, "public", "favicon-32.png"));
console.log("  ✓ favicon-32.png");

console.log("\n✅ 아이콘 생성 완료! public/icons/ 폴더를 확인하세요.");
