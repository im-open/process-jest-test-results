const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

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

function createResultsFile(results, jobAndStep) {
  const resultsFileName = `test-results-${jobAndStep}.md`;

  core.info(`\nWriting results to ${resultsFileName}`);
  let resultsFilePath = null;

  fs.writeFile(resultsFileName, results, err => {
    if (err) {
      core.info(`Error writing results to file. Error: ${err}`);
    } else {
      core.info('Successfully created results file.');
      core.info(`File: ${resultsFileName}`);
    }
  });
  resultsFilePath = path.resolve(resultsFileName);
  return resultsFilePath;
}

module.exports = {
  readJsonResultsFromFile,
  areThereAnyFailingTests,
  createResultsFile
};
