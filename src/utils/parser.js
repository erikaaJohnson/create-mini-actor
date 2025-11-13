onst fs = require('fs');
const path = require('path');

/**
 * Safely parses JSON from a string.
 * Throws a descriptive error if parsing fails.
 * @param {string} jsonString
 * @param {string} source
 * @returns {any}
 */
function safeJsonParse(jsonString, source) {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    const error = new Error(`Failed to parse JSON from ${source}: ${err.message}`);
    error.cause = err;
    throw error;
  }
}

/**
 * Normalizes the raw input structure into an array of items.
 * Supported formats:
 *  - { "items": [...] }
 *  - [ ... ]
 *  - single primitive or object value
 * @param {any} raw
 * @returns {Array<any>}
 */
function normalizeInput(raw) {
  if (raw && Array.isArray(raw.items)) {
    return raw.items;
  }

  if (Array.isArray(raw)) {
    return raw;
  }

  // Single value case
  return [raw];
}

/**
 * Reads and parses an input JSON file, normalizing the result to an array.
 * @param {string} inputPath
 * @returns {Array<any>}
 */
function parseInputFile(inputPath) {
  const resolvedPath = path.resolve(inputPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Input file does not exist: ${resolvedPath}`);
  }

  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile()) {
    throw new Error(`Input path is not a file: ${resolvedPath}`);
  }

  const content = fs.readFileSync(resolvedPath, 'utf8');
  if (!content.trim()) {
    // Empty file: treat as empty list
    return [];
  }

  const raw = safeJsonParse(content, resolvedPath);
  return normalizeInput(raw);
}

module.exports = {
  parseInputFile
};