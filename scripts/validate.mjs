import fs from "fs";
import path from "path";
import vm from "vm";
import { execFileSync } from "child_process";

const rootDir = process.cwd();
const appDir = path.join(rootDir, "MCU Tracker");
const dataDir = path.join(appDir, "data");

const requiredDataFiles = [
  "infinity-part1.js",
  "infinity-part2.js",
  "infinity-part3.js",
  "multiverse-saga.js",
  "multiverse-collection.js",
  "upcoming.js",
  "data.js",
  "achievement.js",
  "app.js"
];

console.log("1. Checking Node.js server syntax...");
execFileSync(process.execPath, ["--check", path.join(rootDir, "server.js")], {
  stdio: "inherit"
});

console.log("2. Checking client-side JavaScript syntax...");
for (const file of requiredDataFiles) {
  const fullPath = path.join(dataDir, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required script file: ${fullPath}`);
  }
  execFileSync(process.execPath, ["--check", fullPath], { stdio: "inherit" });
}

console.log("3. Checking HTML & CSS asset references...");
const indexHtml = fs.readFileSync(path.join(appDir, "index.html"), "utf8");
const styleCss = fs.readFileSync(path.join(appDir, "style.css"), "utf8");

if (!indexHtml.includes('href="style.css"')) {
  throw new Error("index.html is missing style.css stylesheet link.");
}
if (!styleCss.includes('images/background/mcu-bg.jpg') || !fs.existsSync(path.join(appDir, "images/background/mcu-bg.jpg"))) {
  throw new Error("Hero background image images/background/mcu-bg.jpg is missing.");
}

for (const file of requiredDataFiles) {
  if (!indexHtml.includes(`src="data/${file}"`)) {
    throw new Error(`index.html does not load data/${file}`);
  }
}

console.log("4. Validating dataset & image paths...");
const ctx = { console: { log: () => {}, warn: console.warn, error: console.error } };
vm.createContext(ctx);
for (const file of requiredDataFiles.slice(0, 8)) {
  vm.runInContext(fs.readFileSync(path.join(dataDir, file), "utf8"), ctx, {
    filename: file
  });
}

const timeline = vm.runInContext("mcuTimeline", ctx);
const achievements = vm.runInContext("achievementsData", ctx);

if (!Array.isArray(timeline) || timeline.length === 0) {
  throw new Error("mcuTimeline failed to load or is empty.");
}

const ids = new Set();
const slugs = new Set();
const missingAssets = [];

for (const entry of timeline) {
  if (entry.id == null) throw new Error(`Entry missing id: ${entry.title}`);
  if (ids.has(entry.id)) throw new Error(`Duplicate id ${entry.id} on ${entry.title}`);
  ids.add(entry.id);

  if (entry.slug) {
    if (slugs.has(entry.slug)) throw new Error(`Duplicate slug ${entry.slug} on ${entry.title}`);
    slugs.add(entry.slug);
  }

  for (const field of ["poster", "logo", "backdrop"]) {
    if (entry[field] && !fs.existsSync(path.join(appDir, entry[field]))) {
      missingAssets.push(`${entry.title} (${field}): ${entry[field]}`);
    }
  }
  const icons = Array.isArray(entry.icon) ? entry.icon : entry.icon ? [entry.icon] : [];
  for (const iconPath of icons) {
    if (!fs.existsSync(path.join(appDir, iconPath))) {
      missingAssets.push(`${entry.title} (icon): ${iconPath}`);
    }
  }
}

for (const ach of achievements) {
  const getBadge = vm.runInContext("getBadgeIconPath", ctx);
  const badgePath = getBadge(ach.badge);
  if (!fs.existsSync(path.join(appDir, badgePath))) {
    missingAssets.push(`Achievement ${ach.id}: ${badgePath}`);
  }
}

if (missingAssets.length > 0) {
  throw new Error(`Missing asset files:\n${missingAssets.join("\n")}`);
}

console.log(`Validation passed: ${timeline.length} timeline items, ${achievements.length} achievements, 0 missing assets.`);
