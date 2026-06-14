/**
 * 꿈신문사 앱스토어 제출용 전체 이미지 자산 생성 스크립트
 * 실행: node generate-assets.mjs
 *
 * 생성 목록:
 *  - public/icons/icon-*.png  (앱 아이콘 전 사이즈)
 *  - public/apple-touch-icon.png
 *  - public/favicon-32.png
 *  - public/splash-2732.png   (iOS/Android 스플래시 2732x2732)
 *  - android-assets/          (Android 전용 아이콘 폴더)
 *  - ios-assets/              (iOS 전용 아이콘 폴더)
 */
import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const iconSvg  = readFileSync(join(__dirname, "public", "icon.svg"));
const splashSvg = readFileSync(join(__dirname, "public", "splash.svg"));

// ── 1. 웹 아이콘 (manifest.json용) ────────────────────────────
console.log("\n📱 웹 아이콘 생성 중...");
const webIconDir = join(__dirname, "public", "icons");
mkdirSync(webIconDir, { recursive: true });

for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
  await sharp(iconSvg).resize(size, size).png({ quality: 100 })
    .toFile(join(webIconDir, `icon-${size}.png`));
  console.log(`  ✓ icon-${size}.png`);
}

await sharp(iconSvg).resize(180, 180).png()
  .toFile(join(__dirname, "public", "apple-touch-icon.png"));
console.log("  ✓ apple-touch-icon.png");

await sharp(iconSvg).resize(32, 32).png()
  .toFile(join(__dirname, "public", "favicon-32.png"));
console.log("  ✓ favicon-32.png");

// ── 2. 스플래시 스크린 PNG ────────────────────────────────────
console.log("\n🌅 스플래시 스크린 생성 중...");
await sharp(splashSvg).resize(2732, 2732).png({ quality: 100 })
  .toFile(join(__dirname, "public", "splash-2732.png"));
console.log("  ✓ splash-2732.png (2732×2732)");

// ── 3. Android 아이콘 ─────────────────────────────────────────
console.log("\n🤖 Android 아이콘 생성 중...");
const androidAssets = [
  { dir: "mipmap-mdpi",    size: 48  },
  { dir: "mipmap-hdpi",    size: 72  },
  { dir: "mipmap-xhdpi",   size: 96  },
  { dir: "mipmap-xxhdpi",  size: 144 },
  { dir: "mipmap-xxxhdpi", size: 192 },
];

for (const { dir, size } of androidAssets) {
  const outDir = join(__dirname, "android-assets", dir);
  mkdirSync(outDir, { recursive: true });

  // ic_launcher.png (일반 아이콘)
  await sharp(iconSvg).resize(size, size).png()
    .toFile(join(outDir, "ic_launcher.png"));

  // ic_launcher_round.png (원형 아이콘)
  // 원형 마스크 적용
  const circle = Buffer.from(`<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}" /></svg>`);
  await sharp(iconSvg)
    .resize(size, size)
    .composite([{ input: circle, blend: "dest-in" }])
    .png()
    .toFile(join(outDir, "ic_launcher_round.png"));

  // ic_launcher_foreground.png (Adaptive icon foreground — 108dp, 아이콘을 중앙에 배치)
  const fgSize = Math.round(size * 1.5);  // 안전 영역 포함 크기
  await sharp(iconSvg).resize(size, size)
    .extend({ top: Math.round(size*0.25), bottom: Math.round(size*0.25),
              left: Math.round(size*0.25), right: Math.round(size*0.25),
              background: "#1A1A1A" })
    .png()
    .toFile(join(outDir, "ic_launcher_foreground.png"));

  console.log(`  ✓ ${dir} (${size}px)`);
}

// Android 스플래시 (splash.png → res/drawable/)
const androidDrawable = join(__dirname, "android-assets", "drawable");
mkdirSync(androidDrawable, { recursive: true });
await sharp(splashSvg).resize(1080, 1920, { fit: "contain", background: "#1A1A1A" }).png()
  .toFile(join(androidDrawable, "splash.png"));
console.log("  ✓ drawable/splash.png (1080×1920)");

// ── 4. iOS 아이콘 ─────────────────────────────────────────────
console.log("\n🍎 iOS 아이콘 생성 중...");
const iosIconSizes = [
  { name: "Icon-20@1x.png",  size: 20  },
  { name: "Icon-20@2x.png",  size: 40  },
  { name: "Icon-20@3x.png",  size: 60  },
  { name: "Icon-29@1x.png",  size: 29  },
  { name: "Icon-29@2x.png",  size: 58  },
  { name: "Icon-29@3x.png",  size: 87  },
  { name: "Icon-40@1x.png",  size: 40  },
  { name: "Icon-40@2x.png",  size: 80  },
  { name: "Icon-40@3x.png",  size: 120 },
  { name: "Icon-60@2x.png",  size: 120 },
  { name: "Icon-60@3x.png",  size: 180 },
  { name: "Icon-76@1x.png",  size: 76  },
  { name: "Icon-76@2x.png",  size: 152 },
  { name: "Icon-83.5@2x.png",size: 167 },
  { name: "Icon-1024.png",   size: 1024 },  // App Store 제출용
];

const iosAssetDir = join(__dirname, "ios-assets", "AppIcon.appiconset");
mkdirSync(iosAssetDir, { recursive: true });

for (const { name, size } of iosIconSizes) {
  await sharp(iconSvg).resize(size, size).png({ quality: 100 })
    .toFile(join(iosAssetDir, name));
  console.log(`  ✓ ${name} (${size}px)`);
}

// iOS용 Contents.json (Xcode Asset Catalog)
const contentsJson = {
  images: [
    { filename: "Icon-20@1x.png",  idiom: "ipad",        scale: "1x", size: "20x20" },
    { filename: "Icon-20@2x.png",  idiom: "iphone",      scale: "2x", size: "20x20" },
    { filename: "Icon-20@2x.png",  idiom: "ipad",        scale: "2x", size: "20x20" },
    { filename: "Icon-20@3x.png",  idiom: "iphone",      scale: "3x", size: "20x20" },
    { filename: "Icon-29@1x.png",  idiom: "iphone",      scale: "1x", size: "29x29" },
    { filename: "Icon-29@1x.png",  idiom: "ipad",        scale: "1x", size: "29x29" },
    { filename: "Icon-29@2x.png",  idiom: "iphone",      scale: "2x", size: "29x29" },
    { filename: "Icon-29@2x.png",  idiom: "ipad",        scale: "2x", size: "29x29" },
    { filename: "Icon-29@3x.png",  idiom: "iphone",      scale: "3x", size: "29x29" },
    { filename: "Icon-40@1x.png",  idiom: "ipad",        scale: "1x", size: "40x40" },
    { filename: "Icon-40@2x.png",  idiom: "iphone",      scale: "2x", size: "40x40" },
    { filename: "Icon-40@2x.png",  idiom: "ipad",        scale: "2x", size: "40x40" },
    { filename: "Icon-40@3x.png",  idiom: "iphone",      scale: "3x", size: "40x40" },
    { filename: "Icon-60@2x.png",  idiom: "iphone",      scale: "2x", size: "60x60" },
    { filename: "Icon-60@3x.png",  idiom: "iphone",      scale: "3x", size: "60x60" },
    { filename: "Icon-76@1x.png",  idiom: "ipad",        scale: "1x", size: "76x76" },
    { filename: "Icon-76@2x.png",  idiom: "ipad",        scale: "2x", size: "76x76" },
    { filename: "Icon-83.5@2x.png",idiom: "ipad",        scale: "2x", size: "83.5x83.5" },
    { filename: "Icon-1024.png",   idiom: "ios-marketing",scale: "1x", size: "1024x1024" },
  ],
  info: { author: "xcode", version: 1 }
};

import { writeFileSync } from "fs";
writeFileSync(
  join(iosAssetDir, "Contents.json"),
  JSON.stringify(contentsJson, null, 2)
);
console.log("  ✓ Contents.json (Xcode Asset Catalog)");

// iOS LaunchScreen 이미지
const iosLaunchDir = join(__dirname, "ios-assets", "LaunchScreen");
mkdirSync(iosLaunchDir, { recursive: true });
await sharp(splashSvg).resize(1242, 2688, { fit: "contain", background: "#1A1A1A" }).png()
  .toFile(join(iosLaunchDir, "Default@3x~iphone.png"));
await sharp(splashSvg).resize(828, 1792, { fit: "contain", background: "#1A1A1A" }).png()
  .toFile(join(iosLaunchDir, "Default@2x~iphone.png"));
console.log("  ✓ LaunchScreen 이미지 2종");

console.log("\n✅ 모든 앱스토어 자산 생성 완료!");
console.log("   android-assets/ → Android Studio에 복사");
console.log("   ios-assets/     → Xcode 프로젝트에 복사");
console.log("   public/         → 웹/PWA 자산");
