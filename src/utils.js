const core = require('@actions/core');
const fs = require('fs');

async function readJsonResultsFromFile(resultsFile) {
  core.info('Reading results from jest results file....');
  if (fs.existsSync(resultsFile)) {
    const rawJson = fs.readFileSync(resultsFile, 'utf8');
    if (!rawJson) {
      core.info(
        `The results file '${resultsFile}' does not contain any data.  No status check or PR comment will be created.`
      );
      return;
    }
    return JSON.parse(rawJson);
  } else {
    core.setFailed(`The results file '${resultsFile}' does not exist.  No status check or PR comment will be created.`);
    return;
  }
}

function areThereAnyFailingTests(json) {
  core.info(`Checking for failing tests..`);

  if (json.numFailedTests > 0) {
    core.warning(`At least one failing test was found.`);
    return true;
  }

  core.info(`There are no failing tests.`);
  return false;
}

module.exports = {
  readJsonResultsFromFile,
  areThereAnyFailingTests
};
