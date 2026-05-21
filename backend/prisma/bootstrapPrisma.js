import { exec } from "child_process";
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const flagFile = path.resolve(".prisma-initialized");

const hasPrismaClient = () => {
  try {
    const clientPath = require.resolve("@prisma/client");
    return fs.existsSync(clientPath);
  } catch (error) {
    return false;
  }
};

const shouldSkipGenerate =
  process.env.VERCEL === "1" ||
  process.env.SKIP_PRISMA_GENERATE === "true" ||
  process.env.NODE_ENV === "production";

export function bootstrapPrisma() {
  return new Promise((resolve, reject) => {
    if (shouldSkipGenerate) {
      if (!hasPrismaClient()) {
        console.warn(
          "⚠️ Prisma client not detected but generation is skipped. Ensure `prisma generate` runs at build time."
        );
      } else {
        console.log("✅ Prisma client detected. Skipping runtime generate.");
      }
      return resolve();
    }

    if (fs.existsSync(flagFile)) {
      console.log("✅ Prisma already initialized.");
      return resolve();
    }

    console.log("🚀 Initializing Prisma...");
    exec("npx prisma generate", (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Prisma init failed:", stderr || error.message);
        return reject(error);
      }

      console.log("✅ Prisma client generated:\n", stdout);
      fs.writeFileSync(flagFile, "initialized");
      resolve();
    });
  });
}
