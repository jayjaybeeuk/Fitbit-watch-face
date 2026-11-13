#!/usr/bin/env node
/**
 * Verifies the file referenced by fitbit.iconFile in package.json.
 *
 * fitbit-build does not fail when the icon is missing or mis-sized: it exits 0
 * and simply packs no icon into the device bundle, so the problem only shows up
 * on the watch. This script turns that into a hard CI failure.
 */

const fs = require("fs");
const path = require("path");

const ICON = path.join(__dirname, "..", "resources", "icon.png");
const SIZE = 80;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const RELATIVE = path.relative(process.cwd(), ICON);

function fail(reason) {
  console.error(`icon check failed: ${reason}`);
  console.error(`expected an ${SIZE}x${SIZE} PNG at ${RELATIVE}`);
  process.exit(1);
}

if (!fs.existsSync(ICON)) {
  fail("file is missing");
}

const png = fs.readFileSync(ICON);

if (png.length < 24) {
  fail("file is too short to contain a PNG header");
}

if (!png.subarray(0, 8).equals(PNG_SIGNATURE)) {
  fail("file is not a PNG");
}

// IHDR must be the first chunk: 4-byte length, "IHDR", then width and height.
if (png.toString("ascii", 12, 16) !== "IHDR") {
  fail("PNG does not start with an IHDR chunk");
}

const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);

if (width !== SIZE || height !== SIZE) {
  fail(`image is ${width}x${height}`);
}

console.log(`icon check passed: ${width}x${height} PNG at ${RELATIVE}`);
