const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function walk(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (entry.isFile() && full.endsWith(".js")) result.push(full);
  }
  return result;
}

async function main() {
  const root = __dirname;
  const files = walk(root).filter(file => !file.includes(path.sep + "node_modules" + path.sep));
  const failures = [];
  for (const file of files) {
    const check = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (check.status !== 0) failures.push(file + "\n" + (check.stderr || check.stdout));
  }
  assert.deepStrictEqual(failures, [], "JavaScript syntax errors detected");

  const loader = require("./lib/commandLoader");
  await loader.loadCommands();
  for (const name of ["menu", "ping", "promote", "demote", "kick", "deluser", "purge"]) {
    assert.ok(loader.getCommand(name), "Missing command: " + name);
    assert.strictEqual(typeof loader.getCommand(name).execute, "function", "Invalid command handler: " + name);
  }

  const permission = require("./lib/permissionMiddleware");
  for (const method of ["setRuntimeOwner", "isOwner", "isOwnerOrSudo", "getOwnerNumber"]) {
    assert.strictEqual(typeof permission[method], "function", "Missing permission helper: " + method);
  }

  console.log("✅ NOXIS-MD smoke tests passed (" + files.length + " JavaScript files checked).");
}

main().catch(error => {
  console.error("❌ NOXIS-MD tests failed:", error);
  process.exitCode = 1;
});
