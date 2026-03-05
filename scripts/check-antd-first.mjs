import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const shouldUpdateBaseline = args.has("--update-baseline");
const baselinePath = path.join("scripts", "antd-first-baseline.json");

const TARGET_DIRS = [path.join("src", "app"), path.join("src", "components")];
const VALID_EXTENSIONS = new Set([".tsx", ".jsx"]);
const TAG_REGEX = /<(button|input|select|table)(\s|>|$)/g;

function walkFiles(directory) {
  const files = [];
  if (!fs.existsSync(directory)) return files;
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    if (VALID_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function collectCurrentCounts() {
  const counts = new Map();
  for (const dir of TARGET_DIRS) {
    const files = walkFiles(dir);
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, "utf8");
      const relativeFile = toPosixPath(path.relative(process.cwd(), filePath));
      const lineCountByTag = new Map();
      for (const line of content.split(/\r?\n/)) {
        TAG_REGEX.lastIndex = 0;
        for (const match of line.matchAll(TAG_REGEX)) {
          const tag = match[1];
          if (!tag) continue;
          lineCountByTag.set(tag, (lineCountByTag.get(tag) ?? 0) + 1);
        }
      }
      for (const [tag, count] of lineCountByTag.entries()) {
        const key = `${relativeFile}::${tag}`;
        counts.set(key, (counts.get(key) ?? 0) + count);
      }
    }
  }
  return counts;
}

function countsToEntries(counts) {
  const entries = [];
  for (const [key, count] of counts.entries()) {
    const [file, tag] = key.split("::");
    entries.push({ file, tag, count });
  }
  entries.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.tag.localeCompare(b.tag);
  });
  return entries;
}

function entriesToMap(entries) {
  const mapped = new Map();
  for (const entry of entries) {
    mapped.set(`${entry.file}::${entry.tag}`, entry.count);
  }
  return mapped;
}

function readBaseline() {
  if (!fs.existsSync(baselinePath)) return null;
  const raw = fs.readFileSync(baselinePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.entries)) {
    throw new Error(`Invalid baseline format in ${baselinePath}`);
  }
  return parsed.entries;
}

function writeBaseline(entries) {
  const payload = {
    generatedAt: new Date().toISOString(),
    entries,
  };
  fs.writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

const currentCounts = collectCurrentCounts();
const currentEntries = countsToEntries(currentCounts);

if (shouldUpdateBaseline) {
  writeBaseline(currentEntries);
  console.log(`Updated ${baselinePath} (${currentEntries.length} entries).`);
  process.exit(0);
}

const baselineEntries = readBaseline();
if (!baselineEntries) {
  console.error(
    `Missing baseline file: ${baselinePath}. Run "npm run antd:first:update-baseline" first.`
  );
  process.exit(1);
}

const baselineMap = entriesToMap(baselineEntries);
const violations = [];

for (const entry of currentEntries) {
  const key = `${entry.file}::${entry.tag}`;
  const baselineCount = baselineMap.get(key) ?? 0;
  if (entry.count > baselineCount) {
    violations.push({
      file: entry.file,
      tag: entry.tag,
      baseline: baselineCount,
      current: entry.count,
      delta: entry.count - baselineCount,
    });
  }
}

if (violations.length > 0) {
  console.error("AntD-first check failed. New raw primitives detected:");
  for (const violation of violations) {
    console.error(
      `- ${violation.file} <${violation.tag}>: baseline=${violation.baseline}, current=${violation.current}, delta=+${violation.delta}`
    );
  }
  process.exit(1);
}

console.log(
  `AntD-first check passed. Tracked entries=${currentEntries.length}, no regressions.`
);
