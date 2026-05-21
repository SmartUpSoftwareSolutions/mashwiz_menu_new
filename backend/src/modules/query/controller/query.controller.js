import { SqlServerDB } from "../../../../DB/sqlConnection.js";
import logger from "../../../utils/logger.js";
import { prisma } from "../../../utils/prismaClient.js";

export async function runMashwizQuery(sqlText, params = []) {
  try {
    logger.info(`Executing Supabase query via Prisma: ${sqlText}`, { params });
    const result = await prisma.$queryRawUnsafe(sqlText, ...params);
    return result;
  } catch (error) {
    logger.error(`Supabase query error: ${sqlText}`, {
      error: error.message,
      stack: error.stack,
      params,
    });
    throw error;
  }
}

export const mashwizQueryHandler = async (req, res) => {
  const { query, params = [] } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Missing 'query' in request body" });
  }

  try {
    const result = await prisma.$queryRawUnsafe(query, ...params);
    res.json(result);
  } catch (error) {
    logger.error(`Supabase query handler error: ${query}`, {
      error: error.message,
      stack: error.stack,
      params,
    });
    res.status(500).json({ error: error.message || String(error) });
  }
};

export { prisma };

export async function erpQuery(sqlText, params = {}, dbPool = SqlServerDB) {
  try {
    if (dbPool === SqlServerDB && (SqlServerDB.closed || !SqlServerDB.connected)) {
      logger.info("⚠️ SQL Server connection was closed. Reconnecting...");
      await SqlServerDB.connect();
    } else if (dbPool !== SqlServerDB && !dbPool.connected && !dbPool.connecting) {
      try {
        await dbPool.connect();
      } catch (e) {
        // might already be connected
      }
    }

    logger.info(`Executing ERP query`, { params });

    const request = dbPool.request();

    if (typeof params === "object" && params !== null) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.query(sqlText);
    return result.recordset || [];
  } catch (error) {
    logger.error(`ERP query error: ${sqlText}`, {
      error: error.message,
      stack: error.stack,
      params,
    });
    throw error;
  }
}
