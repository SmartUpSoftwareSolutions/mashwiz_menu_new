import { asyncHandler } from "../../../utils/errorHandling.js";
import ItemTransferService from "../itemTransferService.js";
import LocationTransferService from "../locationTransferService.js";
import { erpQuery, prisma } from "../../query/controller/query.controller.js";
import logger from "../../../utils/logger.js";
import { connectToDatabase, SqlServerDB } from "../../../../DB/sqlConnection.js";

/** ERP pool: uses ERP_DATABASE_NAME from env if set, otherwise falls back to the user's database. */
async function getErpPoolForRequest(req) {
  const dbName = process.env.ERP_DATABASE_NAME || req.user?.databaseName;
  if (!dbName) {
    return { dbPool: SqlServerDB, close: null };
  }
  try {
    const dbPool = await connectToDatabase(dbName);
    return {
      dbPool,
      close: () => dbPool.close().catch(() => {}),
    };
  } catch (connError) {
    throw connError;
  }
}

/** 🔹 Get allowed branch codes from local branches table */
async function getAllowedBranchCodes() {
  try {
    const rows = await prisma.branch.findMany({ select: { code: true } });
    return new Set(rows.map((r) => r.code));
  } catch {
    return null; // null = no filter (allow all)
  }
}

/** 🔹 Sync branches to restaurant_branches table — only updates existing branches, never creates new ones */
const syncBranchesToRestaurantBranches = async (branchesToSync) => {
  try {
    if (!branchesToSync || branchesToSync.length === 0) {
      return { success: true, synced: 0 };
    }

    const validBranches = branchesToSync.filter(branch => branch.code && branch.name);
    if (validBranches.length === 0) return { success: true, synced: 0 };

    let totalSuccessful = 0;
    let totalFailed = 0;

    for (const branch of validBranches) {
      const results = await Promise.allSettled([
        prisma.restaurantBranch.updateMany({
          where: { branch_code: branch.code },
          data: { branch_name: branch.name, updated_at: new Date() },
        }),
        prisma.branch.updateMany({
          where: { code: branch.code },
          data: { name: branch.name },
        }),
      ]);

      results.forEach((r) => {
        if (r.status === 'fulfilled') totalSuccessful++;
        else {
          totalFailed++;
          logger.error(`Error updating branch ${branch.code}:`, r.reason?.message);
        }
      });
    }

    logger.info(`✅ Updated ${totalSuccessful} branch records`);
    return { success: true, synced: totalSuccessful, failed: totalFailed };
  } catch (error) {
    logger.error("Error syncing branches:", error);
    return { success: false, error: error.message, skipped: true };
  }
};

export const item = asyncHandler(async (req, res) => {
  const { branch_code } = req.body;
  if (!branch_code) {
    return res.status(400).json({
      success: false,
      message: "Branch code is required",
    });
  }

  let close = null;
  try {
    const { dbPool, close: closeFn } = await getErpPoolForRequest(req);
    close = closeFn;
    const result = await ItemTransferService.transferItemMaster(branch_code, dbPool);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to transfer items",
      error: error.message,
    });
  } finally {
    if (close) await close();
  }
});

export const groups = asyncHandler(async (req, res) => {
  const { branch_code } = req.body;
  if (!branch_code) {
    return res.status(400).json({
      success: false,
      message: "Branch code is required",
    });
  }

  let close = null;
  try {
    const { dbPool, close: closeFn } = await getErpPoolForRequest(req);
    close = closeFn;
    const result = await ItemTransferService.transferItemMainGroups(
      branch_code,
      dbPool
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to transfer item groups",
      error: error.message,
    });
  } finally {
    if (close) await close();
  }
});

export const AllItems = asyncHandler(async (req, res) => {
  const { branch_code } = req.body;
  if (!branch_code) {
    return res.status(400).json({
      success: false,
      message: "Branch code is required",
    });
  }

  let close = null;
  try {
    const { dbPool, close: closeFn } = await getErpPoolForRequest(req);
    close = closeFn;
    const result = await ItemTransferService.transferAllItems(branch_code, dbPool);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to transfer all item data",
      error: error.message,
    });
  } finally {
    if (close) await close();
  }
});

export const syncAllBranchesStream = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Keepalive: prevents the browser from closing an idle SSE connection
  // while the backend is waiting on a DB query before sending `init`.
  const keepalive = setInterval(() => {
    if (!res.writableEnded) res.write(": ping\n\n");
  }, 5000);

  const cleanup = () => {
    clearInterval(keepalive);
    if (!res.writableEnded) res.end();
  };

  req.on("close", cleanup);

  try {
    let dbPool = SqlServerDB;
    const erpDbName = process.env.ERP_DATABASE_NAME || req.user?.databaseName;
    if (erpDbName) {
      try {
        dbPool = await connectToDatabase(erpDbName);
      } catch (connError) {
        send({ type: "error", message: `Failed to connect to database: ${connError.message}` });
        return res.end();
      }
    }

    let branchRecords;
    try {
      branchRecords = await erpQuery(
        `SELECT BRANCH_CODE, BRANCH_NAME
        FROM SYS_COMPANY_BRANCHES
        WHERE Active = 1
        ORDER BY BRANCH_CODE;`,
        {},
        dbPool
      );
    } catch (erpError) {
      send({ type: "error", message: `Failed to query branches: ${erpError.message}` });
      return res.end();
    }

    const allowedCodes = await getAllowedBranchCodes();

    const branchesToSync = branchRecords
      .map((b) => ({
        code: b?.BRANCH_CODE?.trim?.() || b?.branch_code?.trim?.() || "",
        name: b?.BRANCH_NAME?.trim?.() || b?.BRANCH_CODE?.trim?.() || "",
      }))
      .filter((b) => b.code && (!allowedCodes || allowedCodes.has(b.code)));

    if (branchesToSync.length === 0) {
      send({ type: "error", message: "No matching branches found. Ensure branches are configured in the Branches admin page." });
      return res.end();
    }

    send({ type: "init", branches: branchesToSync });

    let synced = 0;
    let failed = 0;

    for (const branch of branchesToSync) {
      if (res.writableEnded) break;
      send({ type: "start", branchCode: branch.code });

      try {
        let itemsResult;
        try {
          itemsResult = await ItemTransferService.transferAllItems(branch.code, dbPool);
        } catch (e) {
          itemsResult = { success: false, message: e.message };
        }

        try {
          await LocationTransferService.transferLocations(branch.code, branch.name, dbPool);
        } catch (_) {}

        if (itemsResult?.success) {
          synced++;
          send({ type: "done", branchCode: branch.code });
        } else {
          failed++;
          const errMsg =
            itemsResult?.message ||
            itemsResult?.items?.message ||
            itemsResult?.groups?.message ||
            "Sync failed";
          send({ type: "failed", branchCode: branch.code, error: errMsg });
        }
      } catch (error) {
        failed++;
        send({ type: "failed", branchCode: branch.code, error: error.message });
      }
    }

    await syncBranchesToRestaurantBranches(branchesToSync).catch(() => {});
    send({ type: "complete", summary: { total: branchesToSync.length, synced, failed } });
  } catch (error) {
    send({ type: "error", message: error.message });
  } finally {
    cleanup();
  }
};

export const syncAllBranches = asyncHandler(async (req, res) => {
  let dbPool = SqlServerDB; // Default to the main connection
  const erpDbName = process.env.ERP_DATABASE_NAME || req.user?.databaseName;
  try {
    if (erpDbName) {
      logger.info(`Switching to database: ${erpDbName} for sync operation`);
      try {
        dbPool = await connectToDatabase(erpDbName);
      } catch (connError) {
        logger.error(`Failed to connect to database ${erpDbName}:`, connError);
        return res.status(500).json({
          success: false,
          message: `Failed to connect to target database: ${erpDbName}`,
          error: connError.message,
        });
      }
    }

    const requestedBranchCodes = Array.isArray(req.body?.branchCodes)
      ? req.body.branchCodes
          .map((code) =>
            typeof code === "string" ? code.trim().toUpperCase() : ""
          )
          .filter(Boolean)
      : [];

    let branchRecords = [];

    if (requestedBranchCodes.length > 0) {
      branchRecords = requestedBranchCodes.map((code) => ({
        BRANCH_CODE: code,
        BRANCH_NAME: code,
      }));
    } else {
      branchRecords = await erpQuery(`
        SELECT BRANCH_CODE, BRANCH_NAME
        FROM SYS_COMPANY_BRANCHES
        WHERE Active = 1
        ORDER BY BRANCH_CODE;
      `, {}, dbPool);
      
    }

    const allowedCodes = await getAllowedBranchCodes();

    const branchesToSync = branchRecords
      .map((branch) => ({
        code:
          branch?.BRANCH_CODE?.trim?.() ||
          branch?.branch_code?.trim?.() ||
          branch?.BRANCH?.trim?.() ||
          "",
        name:
          branch?.BRANCH_NAME?.trim?.() ||
          branch?.branch_name?.trim?.() ||
          branch?.BRANCH?.trim?.() ||
          branch?.BRANCH_CODE?.trim?.() ||
          "",
      }))
      .filter((branch) => branch.code && (!allowedCodes || allowedCodes.has(branch.code)));

    if (branchesToSync.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching branches found. Ensure branches are configured in the Branches admin page.",
      });
    }

    // Process branches sequentially to avoid connection pool exhaustion
    const syncResults = [];
    for (const branch of branchesToSync) {
      try {
        logger.info(`Starting sync for branch ${branch.code} (items + locations)`);

        // Items sync - catch errors to prevent crashes
        let itemsResult;
        try {
          itemsResult = await ItemTransferService.transferAllItems(branch.code, dbPool);
          logger.info(`Items sync completed for branch ${branch.code}. Starting location sync...`);
        } catch (itemsError) {
          logger.error(`Items sync failed for branch ${branch.code}:`, itemsError);
          itemsResult = {
            success: false,
            message: `Items sync failed: ${itemsError.message}`,
            error: itemsError.message,
          };
        }
        
        // Location sync - catch errors so they don't crash the whole sync
        let locationResult;
        try {
          locationResult = await LocationTransferService.transferLocations(
            branch.code,
            branch.name,
            dbPool
          );
          logger.info(`Location sync completed for branch ${branch.code}. Result: ${locationResult.success ? 'success' : 'failed'}`);
        } catch (locationError) {
          logger.error(`Location sync failed for branch ${branch.code}:`, locationError);
          locationResult = {
            success: false,
            message: `Location sync failed: ${locationError.message}`,
            error: locationError.message,
          };
        }
        
        syncResults.push({
          status: 'fulfilled',
          value: {
            items: itemsResult,
            location: locationResult,
            success: itemsResult?.success ?? false,
            message: itemsResult?.message || itemsResult?.items?.message || itemsResult?.groups?.message,
          },
        });
      } catch (error) {
        logger.error(`Sync failed for branch ${branch.code}:`, error);
        syncResults.push({
          status: 'rejected',
          reason: error,
        });
      }
    }

    const successes = [];
    const failures = [];

    syncResults.forEach((settledResult, index) => {
      const branch = branchesToSync[index];
      if (settledResult.status === "fulfilled") {
        const result = settledResult.value;
        if (result?.success === false) {
          failures.push({
            branchCode: branch.code,
            branchName: branch.name,
            error: result?.message || "Sync reported failure.",
            details: result,
          });
        } else {
          successes.push({
            branchCode: branch.code,
            branchName: branch.name,
            items: result.items || result,
            location: result.location,
            result: result.items || result,
          });
        }
      } else {
        failures.push({
          branchCode: branch?.code || "UNKNOWN",
          branchName: branch?.name || branch?.code || "UNKNOWN",
          error:
            settledResult.reason?.message ||
            settledResult.reason ||
            "Unknown error",
        });
      }
    });

    // Sync branches to restaurant_branches table
    const branchesSyncResult = await syncBranchesToRestaurantBranches(branchesToSync);
    if (!branchesSyncResult.success) {
      logger.warn("Failed to sync branches to restaurant_branches, but continuing...");
    }

    const totalBranches = branchesToSync.length;
    const responsePayload = {
      success: failures.length === 0,
      message:
        failures.length === 0
          ? `Synced ${successes.length} branches successfully.`
          : failures.length === totalBranches
          ? "Sync failed for all branches."
          : `Synced ${successes.length} branches. ${failures.length} branch(es) failed.`,
      summary: {
        totalBranches,
        syncedBranches: successes.length,
        failedBranches: failures.length,
      },
      successes,
      failures,
    };

    const statusCode =
      failures.length === totalBranches
        ? 500
        : failures.length > 0
        ? 207
        : 200;

    return res.status(statusCode).json(responsePayload);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unexpected error while syncing all branches.",
      error: error.message,
    });
  }
});

/** 🔹 Truncate Supabase tables and sync from ERP */
export const truncateAndSyncAllBranches = asyncHandler(async (req, res) => {
  try {
    logger.info("Starting truncate and sync operation - clearing all Supabase data...");

    let dbPool = SqlServerDB; // Default to the main connection
    const erpDbName = process.env.ERP_DATABASE_NAME || req.user?.databaseName;

    if (erpDbName) {
      logger.info(`Switching to database: ${erpDbName} for truncate-and-sync operation`);
      try {
        dbPool = await connectToDatabase(erpDbName);
      } catch (connError) {
        logger.error(`Failed to connect to database ${erpDbName}:`, connError);
        return res.status(500).json({
          success: false,
          message: `Failed to connect to target database: ${erpDbName}`,
          error: connError.message,
        });
      }
    }

    // Clear menu-related collections (items before groups for parity with old FK order).
    try {
      await prisma.itemMaster.deleteMany({});
      await prisma.itemMainGroup.deleteMany({});
      await Promise.allSettled([
        prisma.location.deleteMany({}),
        prisma.restaurantBranch.deleteMany({}).catch((err) => {
          logger.warn(
            "Could not truncate restaurant_branches (table may not exist):",
            err.message
          );
          return { count: 0 };
        }),
      ]);
      logger.info("✅ Successfully truncated all Supabase tables");
    } catch (truncateError) {
      logger.error("Error truncating Supabase tables:", truncateError);
      return res.status(500).json({
        success: false,
        message: "Failed to truncate Supabase tables.",
        error: truncateError.message,
      });
    }

    // Now sync fresh data from new database
    const requestedBranchCodes = Array.isArray(req.body?.branchCodes)
      ? req.body.branchCodes
          .map((code) =>
            typeof code === "string" ? code.trim().toUpperCase() : ""
          )
          .filter(Boolean)
      : [];

    let branchRecords = [];

    if (requestedBranchCodes.length > 0) {
      branchRecords = requestedBranchCodes.map((code) => ({
        BRANCH_CODE: code,
        BRANCH_NAME: code,
      }));
    } else {
      branchRecords = await erpQuery(`
        SELECT BRANCH_CODE, BRANCH_NAME
        FROM SYS_COMPANY_BRANCHES
        WHERE Active = 1
        ORDER BY BRANCH_CODE;
      `, {}, dbPool);
    }

    const allowedCodesForTruncate = await getAllowedBranchCodes();

    const branchesToSync = branchRecords
      .map((branch) => ({
        code:
          branch?.BRANCH_CODE?.trim?.() ||
          branch?.branch_code?.trim?.() ||
          branch?.BRANCH?.trim?.() ||
          "",
        name:
          branch?.BRANCH_NAME?.trim?.() ||
          branch?.branch_name?.trim?.() ||
          branch?.BRANCH?.trim?.() ||
          branch?.BRANCH_CODE?.trim?.() ||
          "",
      }))
      .filter((branch) => branch.code && (!allowedCodesForTruncate || allowedCodesForTruncate.has(branch.code)));

    if (branchesToSync.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching branches found. Ensure branches are configured in the Branches admin page.",
      });
    }

    logger.info(`Syncing ${branchesToSync.length} branches from new database...`);

    // Process branches sequentially to avoid connection pool exhaustion
    // This ensures each branch completes fully before starting the next one
    const syncResults = [];
    for (const branch of branchesToSync) {
      try {
        logger.info(`Starting sync for branch ${branch.code} (items + locations)`);
        
        // First sync groups, then items (groups must exist before items due to FK constraint)
        const itemsResult = await ItemTransferService.transferAllItems(branch.code, dbPool);
        logger.info(`Items sync completed for branch ${branch.code}. Starting location sync...`);
        
        // Location sync - catch errors so they don't crash the whole sync
        let locationResult;
        try {
          locationResult = await LocationTransferService.transferLocations(
            branch.code,
            branch.name,
            dbPool
          );
          logger.info(`Location sync completed for branch ${branch.code}. Result: ${locationResult.success ? 'success' : 'failed'}`);
        } catch (locationError) {
          logger.error(`Location sync failed for branch ${branch.code}:`, locationError);
          locationResult = {
            success: false,
            message: `Location sync failed: ${locationError.message}`,
            error: locationError.message,
          };
        }
        
        syncResults.push({
          status: 'fulfilled',
          value: {
            items: itemsResult,
            location: locationResult,
            success: itemsResult.success,
          },
        });
      } catch (error) {
        logger.error(`Sync failed for branch ${branch.code}:`, error);
        syncResults.push({
          status: 'rejected',
          reason: error,
        });
      }
    }

    const successes = [];
    const failures = [];

    syncResults.forEach((settledResult, index) => {
      const branch = branchesToSync[index];
      if (settledResult.status === "fulfilled") {
        const result = settledResult.value;
        if (result?.success === false) {
          failures.push({
            branchCode: branch.code,
            branchName: branch.name,
            error: result?.message || "Sync reported failure.",
            details: result,
          });
        } else {
          successes.push({
            branchCode: branch.code,
            branchName: branch.name,
            items: result.items || result,
            location: result.location,
            result: result.items || result,
          });
        }
      } else {
        failures.push({
          branchCode: branch?.code || "UNKNOWN",
          branchName: branch?.name || branch?.code || "UNKNOWN",
          error:
            settledResult.reason?.message ||
            settledResult.reason ||
            "Unknown error",
        });
      }
    });

    // Sync branches to restaurant_branches table
    const branchesSyncResult = await syncBranchesToRestaurantBranches(branchesToSync);
    if (!branchesSyncResult.success) {
      logger.warn("Failed to sync branches to restaurant_branches, but continuing...");
    }

    const totalBranches = branchesToSync.length;
    const responsePayload = {
      success: failures.length === 0,
      message:
        failures.length === 0
          ? `Truncated and synced ${successes.length} branches successfully from new database.`
          : failures.length === totalBranches
          ? "Truncate and sync failed for all branches."
          : `Truncated and synced ${successes.length} branches. ${failures.length} branch(es) failed.`,
      summary: {
        totalBranches,
        syncedBranches: successes.length,
        failedBranches: failures.length,
        truncated: true,
      },
      successes,
      failures,
    };

    const statusCode =
      failures.length === totalBranches
        ? 500
        : failures.length > 0
        ? 207
        : 200;

    logger.info(`Truncate and sync operation completed: ${successes.length} succeeded, ${failures.length} failed`);
    
    return res.status(statusCode).json(responsePayload);
  } catch (error) {
    logger.error("Unexpected error in truncate and sync operation:", error);
    return res.status(500).json({
      success: false,
      message: "Unexpected error while truncating and syncing.",
      error: error.message,
    });
  }
});