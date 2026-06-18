const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { buildSync } = require("esbuild");

// 0. Validate manifests before building
try {
  execSync("node validate.cjs", { stdio: "inherit" });
} catch (_) {
  process.exit(1);
}

const VER = JSON.parse(fs.readFileSync("manifest.json", "utf8")).version;
const BUILD = "build";

const STATIC_FILES = [
  "popup.html",
  "popup.js",
  "background.js",
  "icon-32.png",
  "icon-48.png",
  "icon-128.png",
  "LICENSE",
];

const targets = [
  { name: "chrome", manifest: "manifest.json" },
  { name: "firefox", manifest: "manifest-firefox.json" },
];

// 1. Bundle src/content/main.js → content.js (ES module single-file output)
buildSync({
  entryPoints: ["src/content/main.js"],
  bundle: true,
  format: "esm",
  outfile: "content.js",
  target: "chrome100",
  minify: false,
  sourcemap: false,
});

console.log("Bundled content.js");

// Helper: copy extension files to a directory
function copyExtensionFiles(dest) {
  for (const f of STATIC_FILES) {
    fs.cpSync(f, path.join(dest, f));
  }
  fs.cpSync("content.js", path.join(dest, "content.js"));
}

// 2. Create zip for each target + unpacked folder for Chrome
for (const t of targets) {
  // Zip
  const tmp = fs.mkdtempSync("build-");
  const out = path.join(BUILD, `comment-vaccinator-${t.name}-v${VER}.zip`);

  copyExtensionFiles(tmp);
  fs.cpSync(t.manifest, path.join(tmp, "manifest.json"));

  const files = fs
    .readdirSync(tmp)
    .map((f) => `"${path.join(tmp, f)}"`)
    .join(",");
  execSync(
    `powershell -Command "Compress-Archive -Path ${files} -DestinationPath '${out}' -Force"`,
    { stdio: "pipe" }
  );
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Created ${out}`);

  // Unpacked folder (for Chrome "Load unpacked")
  if (t.name === "chrome") {
    const unpackedDir = path.join(BUILD, "chrome-unpacked");
    if (fs.existsSync(unpackedDir)) {
      fs.rmSync(unpackedDir, { recursive: true, force: true });
    }
    fs.mkdirSync(unpackedDir, { recursive: true });
    copyExtensionFiles(unpackedDir);
    fs.cpSync(t.manifest, path.join(unpackedDir, "manifest.json"));
    console.log(`Created ${unpackedDir} (use "Load unpacked" in chrome://extensions)`);
  }
}

// Clean up bundled content.js from root (it's only needed in zips)
fs.unlinkSync("content.js");
console.log("Done.");
