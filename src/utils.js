import { info, setFailed, warning } from '@actions/core';
import { readFileSync, writeFile } from 'fs';
import { resolve } from 'path';

async function readJsonResultsFromFile(resultsFile) {
  info('Reading results from jest results file....');
  let rawJson;
  try {
    rawJson = readFileSync(resultsFile, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      setFailed(`The results file '${resultsFile}' does not exist. No status check or PR comment will be created.`);
    } else {
      setFailed(`An error occurred: ${err}. No status check or PR comment will be created.`);
    }
    return;
  }
  if (rawJson) {
    return JSON.parse(rawJson);
  }
  info(`The results file '${resultsFile}' does not contain any data. No status check or PR comment will be created.`);
}

function areThereAnyFailingTests(json) {
  info(`\nChecking for failing tests..`);

  if (json.numFailedTests > 0) {
    warning(`At least one failing test was found.`);
    return true;
  }

  info(`There are no failing tests.`);
  return false;
}

function createResultsFile(results, jobAndStep) {
  const resultsFileName = `test-results-${jobAndStep}.md`;

  info(`\nWriting results to ${resultsFileName}`);
  let resultsFilePath = null;

  writeFile(resultsFileName, results, err => {
    if (err) {
      info(`Error writing results to file. Error: ${err}`);
    } else {
      info('Successfully created results file.');
      info(`File: ${resultsFileName}`);
    }
  });
  resultsFilePath = resolve(resultsFileName);
  return resultsFilePath;
}

export { readJsonResultsFromFile, areThereAnyFailingTests, createResultsFile };
