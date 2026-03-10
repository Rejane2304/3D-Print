/**
 * Postinstall script:
 * 1. Creates the .prisma symlink inside @prisma/client so the TypeScript
 *    language server resolves the generated types correctly (yarn v1 does not
 *    create this symlink automatically, unlike npm).
 * 2. Runs `prisma generate` to ensure types are up-to-date.
 */
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const link = path.resolve(__dirname, "../node_modules/@prisma/client/.prisma");
const target = path.resolve(__dirname, "../node_modules/.prisma");

if (!fs.existsSync(link)) {
  try {
    fs.symlinkSync(target, link, "dir");
    console.log("✔ Created @prisma/client/.prisma symlink");
  } catch (e) {
    console.warn(
      "⚠ Could not create @prisma/client/.prisma symlink:",
      e.message,
    );
  }
}

try {
  execSync("npx prisma generate", { stdio: "inherit" });
} catch (e) {
  console.warn("⚠ prisma generate failed (no DATABASE_URL?):", e.message);
}
