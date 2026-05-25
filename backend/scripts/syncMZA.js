import "../config/loadEnv.js";
import ItemTransferService from "../src/modules/menu/itemTransferService.js";
import { SqlServerDB } from "../DB/sqlConnection.js";
import { prisma } from "../src/utils/prismaClient.js";

const BRANCH_CODE = "MZA";

async function main() {
  console.log(`Starting item master sync for branch: ${BRANCH_CODE}`);
  console.log("Connecting to SQL Server...");

  try {
    await SqlServerDB.connect();
    console.log("✅ Connected to SQL Server");
  } catch (err) {
    console.error("❌ SQL Server connection failed:", err.message);
    process.exit(1);
  }

  try {
    console.log("Syncing groups and items...");
    const result = await ItemTransferService.transferAllItems(BRANCH_CODE, SqlServerDB);

    console.log("\n=== Sync Result ===");
    console.log("Success:", result.success);
    console.log("Duration:", result.duration);
    console.log("\nGroups:", JSON.stringify(result.groups, null, 2));
    console.log("\nItems:", JSON.stringify(result.items, null, 2));

    if (!result.success) {
      console.error("\n❌ Sync failed:", result.message);
      process.exit(1);
    }

    console.log("\n✅ Sync completed successfully");
  } catch (err) {
    console.error("❌ Sync error:", err.message);
    process.exit(1);
  } finally {
    await SqlServerDB.close().catch(() => {});
    await prisma.$disconnect().catch(() => {});
  }
}

main();
