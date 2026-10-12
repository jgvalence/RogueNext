import fs from "node:fs";
import path from "node:path";
import {
  CARD_IMAGES,
  ENEMY_IMAGES,
  COMBAT_BACKGROUNDS,
} from "../src/lib/assets";
const folder = "docs/validation-2026-10-12";
const missing: string[] = [];
const sources = new Set([
  ...Object.values(CARD_IMAGES),
  ...Object.values(ENEMY_IMAGES),
  ...Object.values(COMBAT_BACKGROUNDS),
]);
for (const source of sources)
  if (!fs.existsSync(path.join("public", source))) missing.push(source);
const files: Array<{ file: string; bytes: number }> = [];
function walk(directory: string) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(webp|ogg)$/.test(file))
      files.push({
        file: file.replaceAll("\\", "/"),
        bytes: fs.statSync(file).size,
      });
  }
}
walk("public/images");
walk("public/sounds");
const invalidHeaders = files.filter(({ file }) => {
  const header = Buffer.alloc(12),
    fd = fs.openSync(file, "r");
  fs.readSync(fd, header, 0, 12, 0);
  fs.closeSync(fd);
  return file.endsWith(".ogg")
    ? header.toString("ascii", 0, 4) !== "OggS"
    : header.toString("ascii", 0, 4) !== "RIFF" ||
        header.toString("ascii", 8, 12) !== "WEBP";
});
const report = {
  registeredSources: sources.size,
  missing,
  invalidHeaders,
  mediaFiles: files.length,
  mediaBytes: files.reduce((n, f) => n + f.bytes, 0),
  musicBytes: files
    .filter((f) => f.file.endsWith(".ogg"))
    .reduce((n, f) => n + f.bytes, 0),
  largest: [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 15),
};
fs.writeFileSync(
  path.join(folder, "assets.json"),
  JSON.stringify(report, null, 2)
);
console.log(report);
if (missing.length || invalidHeaders.length) process.exitCode = 1;
