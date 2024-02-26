const core = require('@actions/core');
const { readJsonResultsFromFile, areThereAnyFailingTests, createResultsFile } = require('./utils');
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

const jobAndStep = `${process.env.GITHUB_ACTION}-${process.env.GITHUB_JOB}`;
const commentIdentifier = core.getInput('comment-identifier') || jobAndStep;

async function run() {
  try {
    const resultsJson = await readJsonResultsFromFile(resultsFile);
    if (!resultsJson) {
      core.setOutput('test-outcome', 'Failed');
      return;
    }

    const failingTestsFound = areThereAnyFailingTests(resultsJson);
    core.setOutput('test-outcome', failingTestsFound ? 'Failed' : 'Passed');

    let markupData = getMarkupForJson(resultsJson, reportName);

    // Create this automatically to facilitate testing
    const resultsFilePath = createResultsFile(markupData, jobAndStep);
    core.setOutput('test-results-file-path', resultsFilePath);

    if (shouldCreateStatusCheck) {
      let conclusion = 'success';
      if (!resultsJson.success) {
        conclusion = ignoreTestFailures ? 'neutral' : 'failure';
      }
      const checkId = await createStatusCheck(token, markupData, conclusion, reportName);
      core.setOutput('status-check-id', checkId); // This is mainly for testing purposes
    }

    if (shouldCreatePRComment) {
      core.info(`\nCreating a PR comment with length ${markupData.length}...`);

      // GitHub API has a limit of 65535 characters for a comment so truncate the markup if we need to
      const charLimit = 65535;
      let truncated = false;
      if (markupData.length > charLimit) {
        const message = `Truncating markup data due to character limit exceeded for GitHub API.  Markup data length: ${markupData.length}/${charLimit}`;
        core.info(message);

        truncated = true;
        const truncatedMessage = `Test results truncated due to character limit.  See full report in output.`;
        markupData = `${truncatedMessage}\n${markupData.substring(0, charLimit - 100)}`;
      }
      core.setOutput('test-results-truncated', truncated);

      const commentId = await createPrComment(token, markupData, updateCommentIfOneExists, commentIdentifier);
      core.setOutput('pr-comment-id', commentId); // This is mainly for testing purposes
    }
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
