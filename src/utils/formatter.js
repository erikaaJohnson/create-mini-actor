onst path = require('path');
const settings = require('../config/settings.json');

const LOG_LEVELS = ['silent', 'error', 'info', 'debug'];

function getLogLevel() {
  const level = (settings.logLevel || 'info').toLowerCase();
  if (!LOG_LEVELS.includes(level)) {
    return 'info';
  }
  return level;
}

const currentLevel = getLogLevel();

function shouldLogInfo() {
  return currentLevel === 'info' || currentLevel === 'debug';
}

function shouldLogDebug() {
  return currentLevel === 'debug';
}

function shouldLogError() {
  return currentLevel === 'error' || currentLevel === 'info' || currentLevel === 'debug';
}

/**
 * Formats a single processing result record.
 * @param {any} input Original input value
 * @param {any} result Processed output
 * @param {string} logs Optional log message
 * @returns {{input:any, result:any, logs:string}}
 */
function formatResult(input, result, logs) {
  return {
    input,
    result,
    logs
  };
}

/**
 * Logs an informational message if the log level allows it.
 * @param {string} message
 */
function logInfo(message) {
  if (shouldLogInfo()) {
    console.log(`[INFO] ${message}`);
  }
}

/**
 * Logs a debug message if the log level allows it.
 * @param {string} message
 */
function logDebug(message) {
  if (shouldLogDebug()) {
    console.log(`[DEBUG] ${message}`);
  }
}

/**
 * Logs an error message if the log level allows it.
 * @param {string | Error} err
 */
function logError(err) {
  if (!shouldLogError()) {
    return;
  }

  if (err instanceof Error) {
    console.error(`[ERROR] ${err.message}`);
    if (shouldLogDebug() && err.stack) {
      console.error(err.stack);
    }
  } else {
    console.error(`[ERROR] ${err}`);
  }
}

/**
 * Builds a human-readable description of the current script location.
 * @returns {string}
 */
function describeRuntimeContext() {
  const scriptPath = process.argv[1] || __filename;
  return `Running at ${path.resolve(scriptPath)}`;
}

module.exports = {
  formatResult,
  logInfo,
  logDebug,
  logError,
  describeRuntimeContext
};