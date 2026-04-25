#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "apps", "extension", "public");
const compiled = path.join(root, "dist", "compiled");
const target = path.join(root, "dist", "chrome-extension");

copyFile("package.json", path.join(root, "dist", "package.json"));
copyFile(path.join(publicDir, "manifest.json"), path.join(target, "manifest.json"));
copyFile(path.join(publicDir, "popup.html"), path.join(target, "popup.html"));
copyDir(path.join(publicDir, "icons"), path.join(target, "icons"));
copyFile(path.join(root, "apps", "native-host", "install", "install.sh"), path.join(target, "native", "install.sh"));
copyFile(path.join(root, "apps", "native-host", "install", "diagnose.sh"), path.join(target, "native", "diagnose.sh"));
copyFile(path.join(compiled, "apps", "extension", "src", "background.js"), path.join(target, "background.js"));
copyFile(path.join(compiled, "apps", "extension", "src", "browser-utils.js"), path.join(target, "browser-utils.js"));
copyFile(path.join(compiled, "apps", "extension", "src", "config.js"), path.join(target, "config.js"));
copyFile(path.join(compiled, "apps", "extension", "src", "content.js"), path.join(target, "content.js"));
copyFile(path.join(compiled, "apps", "extension", "src", "popup.js"), path.join(target, "popup.js"));
copyFile(path.join(compiled, "apps", "native-host", "src", "host.cjs"), path.join(target, "native", "host.cjs"));
copyFile(path.join(compiled, "apps", "native-host", "src", "native-utils.cjs"), path.join(target, "native", "native-utils.cjs"));

stripEmptyModuleExport(path.join(target, "background.js"));
stripEmptyModuleExport(path.join(target, "content.js"));
stripEmptyModuleExport(path.join(target, "popup.js"));
chmodExecutable(path.join(target, "native", "install.sh"));
chmodExecutable(path.join(target, "native", "diagnose.sh"));
chmodExecutable(path.join(target, "native", "host.cjs"));

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDir(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(to, { recursive: true });

  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const entryFrom = path.join(from, entry.name);
    const entryTo = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(entryFrom, entryTo);
    else copyFile(entryFrom, entryTo);
  }
}

function stripEmptyModuleExport(file) {
  if (!fs.existsSync(file)) return;
  const code = fs.readFileSync(file, "utf8").replace(/\nexport \{\};\s*$/u, "\n");
  fs.writeFileSync(file, code);
}

function chmodExecutable(file) {
  if (fs.existsSync(file)) fs.chmodSync(file, 0o755);
}
