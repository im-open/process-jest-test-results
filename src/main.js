const core = require('@actions/core');
const { readJsonResultsFromFile, areThereAnyFailingTests } = require('./utils');
const { createStatusCheck, createPrComment } = require('./github');
const { getMarkupForJson } = require('./markup');

const requiredArgOptions = {
  required: true,
  trimWhitespace: true
};

const token = core.getInput('github-token', requiredArgOptions);
const resultsFile = core.getInput('results-file', requiredArgOptions);
const ignoreTestFailures = core.getBooleanInput('ignore-test-failures');
const shouldCreateStatusCheck = core.getBooleanInput('create-status-check');
const shouldCreatePRComment = core.getBooleanInput('create-pr-comment');
const updateCommentIfOneExists = core.getBooleanInput('update-comment-if-one-exists');
const reportName = core.getInput('report-name');

async function run() {
  try {
    const resultsJson = await readJsonResultsFromFile(resultsFile);
    if (!resultsJson) {
      core.setOutput('test-outcome', 'Failed');
      return;
    }

    const failingTestsFound = areThereAnyFailingTests(resultsJson);

    const markupData = getMarkupForJson(resultsJson, reportName);

    let conclusion = 'success';
    if (!resultsJson.success) {
      conclusion = ignoreTestFailures ? 'neutral' : 'failure';
    }

    if (shouldCreateStatusCheck) {
      await createStatusCheck(token, markupData, conclusion, reportName);
    }
    if (shouldCreatePRComment) {
      await createPrComment(token, markupData, updateCommentIfOneExists);
    }

    core.setOutput('test-outcome', failingTestsFound ? 'Failed' : 'Passed');
  } catch (error) {
    if (error instanceof RangeError) {
      core.info(error.message);
      core.setOutput('test-outcome', 'Failed');
      return;
    } else {
      core.setFailed(`An error occurred processing the jest results file: ${error.message}`);
      core.setOutput('test-outcome', 'Failed');
    }
  }
}

run();
