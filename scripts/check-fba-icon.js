#!/usr/bin/env node
/**
 * Asserts the icon actually ships. fitbit-build packs it into each device
 * bundle as resources/icon.png.txi, so checking resources/icon.png alone does
 * not prove the artifact contains it.
 *
 * Dependency-free: build/app.fba is a zip, and each device-<alias>.zip inside it
 * is another zip. Both are read with the central directory format directly.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.join(__dirname, "..");
const FBA = path.join(ROOT, "build", "app.fba");
const ICON_ENTRY = "resources/icon.png.txi";

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;

function fail(reason) {
  console.error(`bundled icon check failed: ${reason}`);
  process.exit(1);
}

/** Locate the end-of-central-directory record, searching backwards. */
function findEndOfCentralDirectory(buf) {
  const lowest = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= lowest; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) return i;
  }
  throw new Error("not a zip archive (no end of central directory record)");
}

/** List the central-directory entries of a zip held in memory. */
function readEntries(buf) {
  const eocd = findEndOfCentralDirectory(buf);
  const count = buf.readUInt16LE(eocd + 10);
  let offset = buf.readUInt32LE(eocd + 16);
  const entries = [];

  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(offset) !== CENTRAL_SIG) {
      throw new Error("corrupt central directory");
    }
    const nameLength = buf.readUInt16LE(offset + 28);
    const extraLength = buf.readUInt16LE(offset + 30);
    const commentLength = buf.readUInt16LE(offset + 32);
    entries.push({
      name: buf.toString("utf8", offset + 46, offset + 46 + nameLength),
      method: buf.readUInt16LE(offset + 10),
      compressedSize: buf.readUInt32LE(offset + 20),
      localHeaderOffset: buf.readUInt32LE(offset + 42),
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

/** Decompress a single entry into a Buffer. */
function extractEntry(buf, entry) {
  const local = entry.localHeaderOffset;
  if (buf.readUInt32LE(local) !== LOCAL_SIG) {
    throw new Error(`corrupt local header for ${entry.name}`);
  }
  const start =
    local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
  const raw = buf.subarray(start, start + entry.compressedSize);

  if (entry.method === 0) return Buffer.from(raw);
  if (entry.method === 8) return zlib.inflateRawSync(raw);
  throw new Error(`unsupported compression method ${entry.method} for ${entry.name}`);
}

if (!fs.existsSync(FBA)) {
  fail("build/app.fba not found - run `npm run build` first");
}

let targets;
try {
  targets = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"))
    .fitbit.buildTargets || [];
} catch (error) {
  fail(`could not read fitbit.buildTargets from package.json (${error.message})`);
}

const fba = fs.readFileSync(FBA);

let deviceBundles;
try {
  deviceBundles = readEntries(fba).filter((entry) => /^device-.+\.zip$/.test(entry.name));
} catch (error) {
  fail(error.message);
}

if (deviceBundles.length === 0) {
  fail("no device-<target>.zip bundles found in build/app.fba");
}

const found = [];
const problems = [];

for (const bundle of deviceBundles) {
  const alias = bundle.name.replace(/^device-/, "").replace(/\.zip$/, "");
  if (targets.length > 0 && !targets.includes(alias)) continue;

  try {
    const entries = readEntries(extractEntry(fba, bundle));
    if (entries.some((entry) => entry.name === ICON_ENTRY)) {
      found.push(alias);
    } else {
      problems.push(`${alias}: ${ICON_ENTRY} is missing from the bundle`);
    }
  } catch (error) {
    problems.push(`${alias}: ${error.message}`);
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`  ${problem}`);
  fail(`${problems.length} device bundle(s) do not contain the icon`);
}

const unbuilt = targets.filter((target) => !found.includes(target));
if (unbuilt.length > 0) {
  fail(`no bundle was built for target(s): ${unbuilt.join(", ")}`);
}

console.log(
  `bundled icon check passed: ${ICON_ENTRY} present for ${found.join(", ")}`
);
