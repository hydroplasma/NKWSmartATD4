#!/usr/bin/env node
/**
 * Postinstall patch for react-native-gesture-handler
 *
 * Problem: react-native-gesture-handler 2.28/2.29 has a buildscript block in its
 * android/build.gradle that hardcodes AGP 8.10.1. EAS Build uses AGP 8.11.0 via
 * AgpVersionAttr attribute matching, causing a conflict:
 *   "Cannot query the value of this provider because it has no value available"
 *
 * Fix: Remove the buildscript block from gesture-handler's build.gradle.
 * The root project's AGP (managed by expo-build-properties) takes precedence anyway.
 *
 * This script runs automatically after `pnpm install` via the postinstall hook.
 */

const fs = require("fs");
const path = require("path");

const buildGradlePath = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native-gesture-handler",
  "android",
  "build.gradle"
);

if (!fs.existsSync(buildGradlePath)) {
  console.log(
    "[patch-gesture-handler] react-native-gesture-handler not found, skipping patch"
  );
  process.exit(0);
}

let content = fs.readFileSync(buildGradlePath, "utf8");

// Check if already patched
if (!content.includes("buildscript {")) {
  console.log("[patch-gesture-handler] Already patched, skipping");
  process.exit(0);
}

// Find and remove the buildscript block
const start = content.indexOf("buildscript {");
if (start === -1) {
  console.log("[patch-gesture-handler] No buildscript block found");
  process.exit(0);
}

// Find matching closing brace
let depth = 0;
let end = start;
for (let i = start; i < content.length; i++) {
  if (content[i] === "{") depth++;
  else if (content[i] === "}") {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}

// Remove the buildscript block
const newContent = content.slice(0, start) + content.slice(end).replace(/^\n+/, "\n");
fs.writeFileSync(buildGradlePath, newContent, "utf8");

console.log(
  "[patch-gesture-handler] Successfully removed buildscript block from react-native-gesture-handler/android/build.gradle"
);
console.log(
  "[patch-gesture-handler] This fixes AGP 8.11.0 incompatibility in EAS Build"
);
