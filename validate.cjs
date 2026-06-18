const fs = require("fs");

const errors = [];
const warnings = [];

function check(file, condition, msg, type = "error") {
  if (!condition) {
    if (type === "error") errors.push(`[${file}] ${msg}`);
    else warnings.push(`[${file}] ${msg}`);
  }
}

// --- Chrome manifest ---
try {
  const chrome = JSON.parse(fs.readFileSync("manifest.json", "utf8"));

  check("manifest.json", chrome.manifest_version === 3, "Must be manifest_version 3");
  check("manifest.json", chrome.permissions?.includes("storage"), "Missing 'storage' permission");
  check("manifest.json", chrome.action, "Missing 'action' key (MV3)");
  check("manifest.json", chrome.background?.service_worker, "Missing background.service_worker");
  check("manifest.json", !chrome.browser_specific_settings, "Chrome manifest should not have browser_specific_settings (ignored by Chrome but unnecessary)", "warning");
  check("manifest.json", chrome.version, "Missing version");
} catch (e) {
  errors.push(`[manifest.json] Failed to parse: ${e.message}`);
}

// --- Firefox manifest ---
try {
  const ff = JSON.parse(fs.readFileSync("manifest-firefox.json", "utf8"));

  check("manifest-firefox.json", ff.manifest_version === 2, "Must be manifest_version 2");
  check("manifest-firefox.json", ff.browser_action, "Missing browser_action (Firefox MV2)");
  check("manifest-firefox.json", ff.background?.scripts, "Missing background.scripts");
  check("manifest-firefox.json", !ff.background?.service_worker, "Firefox MV2 must not use service_worker");
  check("manifest-firefox.json", ff.version, "Missing version");

  // data_collection_permissions
  const dcp = ff.browser_specific_settings?.gecko?.data_collection_permissions;
  check("manifest-firefox.json", dcp, "Missing data_collection_permissions in gecko settings");
  if (dcp) {
    check("manifest-firefox.json", Array.isArray(dcp.required), "data_collection_permissions.required must be an array");
    check("manifest-firefox.json", dcp.required?.includes("none"), "data_collection_permissions.required must include 'none'");
  }

  // strict_min_version
  const minVer = ff.browser_specific_settings?.gecko?.strict_min_version;
  check("manifest-firefox.json", minVer, "Missing strict_min_version");
  if (minVer) {
    const ver = parseFloat(minVer);
    check("manifest-firefox.json", ver >= 142, `strict_min_version ${minVer} too old — data_collection_permissions requires 142+`);
  }
} catch (e) {
  errors.push(`[manifest-firefox.json] Failed to parse: ${e.message}`);
}

// --- Version sync ---
try {
  const chrome = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
  const ff = JSON.parse(fs.readFileSync("manifest-firefox.json", "utf8"));
  check("version-sync", chrome.version === ff.version, `Version mismatch: Chrome=${chrome.version}, Firefox=${ff.version}`);
} catch (_) {}

// --- Output ---
if (warnings.length) {
  console.log("\nWarnings:");
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
}
if (errors.length) {
  console.log("\nErrors:");
  errors.forEach((e) => console.log(`  ✖ ${e}`));
  console.log(`\n${errors.length} error(s), ${warnings.length} warning(s) — build blocked.`);
  process.exit(1);
} else {
  console.log(`✔ Manifest validation passed (${warnings.length} warning(s))`);
}
