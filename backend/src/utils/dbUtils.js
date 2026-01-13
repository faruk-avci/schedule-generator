const { pool } = require('../database/db');

// Cache for table and column metadata
// Key: table_name, Value: { timestamp: number, columns: string[] }
const metadataCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Gets the columns for a table, with caching.
 * @param {string} tableName 
 * @returns {Promise<string[]>}
 */
async function getTableColumns(tableName) {
    const cached = metadataCache.get(tableName);
    const now = Date.now();

    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        return cached.columns;
    }

    try {
        const result = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1
        `, [tableName]);

        const columns = result.rows.map(r => r.column_name);
        metadataCache.set(tableName, {
            timestamp: now,
            columns: columns
        });
        return columns;
    } catch (error) {
        console.error(`Error fetching columns for ${tableName}:`, error);
        return [];
    }
}

/**
 * Checks if a table exists, with caching.
 * @param {string} tableName 
 * @returns {Promise<boolean>}
 */
async function tableExists(tableName) {
    // We can use the column cache to check existence too
    const columns = await getTableColumns(tableName);
    return columns.length > 0;
}

/**
 * Clears the metadata cache. Useful after migrations or imports.
 */
function clearMetadataCache() {
    metadataCache.clear();
}

module.exports = {
    getTableColumns,
    tableExists,
    clearMetadataCache
};
