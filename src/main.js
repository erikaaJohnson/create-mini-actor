onst fs = require('fs');
const path = require('path');

const { parseInputFile } = require('./utils/parser');
const {
  formatResult,
  logInfo,
  logError,
  logDebug,
  describeRuntimeContext
} = require('./utils/formatter');
const settings = require('./config/settings.json');

/**
 * Very small argument parser for flags like:
 *  --input path    or -i path
 *  --output path   or -o path
 * @param {string[]} argv
 * @returns {Record<string, string | boolean>}
 */
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];

    if (token.startsWith('--')) {
      const [key, value] = token.slice(2).split('=');
      if (typeof value !== 'undefined') {
        args[key] = value;
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        args[key] = argv[i + 1];
        i++;
      } else {
        args[key] = true;
      }
    } else if (token.startsWith('-')) {
      const shortKey = token.slice(1);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        args[shortKey] = argv[i + 1];
        i++;
      } else {
        args[shortKey] = true;
      }
    }
  }
  return args;
}

/**
 * Core transformation logic.
 * This is where you plug in your custom automation or processing.
 * @param {any} rawInput
 * @param {number} index
 * @returns {{result:any, logs:string}}
 */
function processItem(rawInput, index) {
  // Normalize input to a string for demonstration purposes.
  const inputString =
    typeof rawInput === 'string'
      ? rawInput
      : typeof rawInput === 'number'
      ? String(rawInput)
      : typeof rawInput === 'object'
      ? JSON.stringify(rawInput)
      : String(rawInput);

  // Example transformation: uppercase and annotate with index.
  const result = `${inputString.toUpperCase()} [processed #${index + 1}]`;

  const logs = `Successfully processed item #${index + 1} with length ${inputString.length}.`;
  logDebug(`Raw input for item #${index + 1}: ${inputString}`);

  return { result, logs };
}

/**
 * Writes results to the given output path as pretty-printed JSON.
 * Ensures the output directory exists.
 * @param {string} outputPath
 * @param {any} data
 */
function writeOutputFile(outputPath, data) {
  const resolvedPath = path.resolve(outputPath);
  const dir = path.dirname(resolvedPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(resolvedPath, json, 'utf8');
  logInfo(`Output written to: ${resolvedPath}`);
}

/**
 * Application entry point.
 */
function run() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);

  const inputPath =
    args.input || args.i || settings.defaultInputPath || 'data/input.sample.json';
  const outputPath =
    args.output || args.o || settings.defaultOutputPath || 'data/output.sample.json';

  logInfo('Create Mini Actor starting up.');
  logDebug(describeRuntimeContext());
  logInfo(`Using input: ${inputPath}`);
  logInfo(`Using output: ${outputPath}`);

  let inputs;
  try {
    inputs = parseInputFile(inputPath);
  } catch (err) {
    logError(err);
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(inputs) || inputs.length === 0) {
    logInfo('No input items found. Nothing to process.');
    writeOutputFile(outputPath, []);
    return;
  }

  const results = [];
  for (let index = 0; index < inputs.length; index++) {
    try {
      const rawInput = inputs[index];
      const { result, logs } = processItem(rawInput, index);
      results.push(formatResult(rawInput, result, logs));
    } catch (err) {
      logError(err);
      // Push an error record so downstream systems can see failures per item.
      results.push(
        formatResult(inputs[index], null, `Error processing item #${index + 1}: ${err.message}`)
      );
    }
  }

  try {
    writeOutputFile(outputPath, results);
    logInfo(`Processing complete. Items processed: ${results.length}.`);
  } catch (err) {
    logError(err);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  run
};