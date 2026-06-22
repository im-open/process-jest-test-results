import { getInput, getBooleanInput, setOutput, info, setFailed } from '@actions/core';
import { readJsonResultsFromFile, areThereAnyFailingTests, createResultsFile } from './utils';
import { createStatusCheck, createPrComment } from './github';
import getMarkupForJson from './markup';

const requiredArgOptions = {
  required: true,
  trimWhitespace: true
};

const token = getInput('github-token', requiredArgOptions);
const resultsFile = getInput('results-file', requiredArgOptions);
const ignoreTestFailures = getBooleanInput('ignore-test-failures');
const shouldCreateStatusCheck = getBooleanInput('create-status-check');
const shouldCreatePRComment = getBooleanInput('create-pr-comment');
const updateCommentIfOneExists = getBooleanInput('update-comment-if-one-exists');
const reportName = getInput('report-name');

const jobAndStep = `${process.env.GITHUB_JOB}_${process.env.GITHUB_ACTION}`;
const commentIdentifier = getInput('comment-identifier') || jobAndStep;

async function run() {
  try {
    const resultsJson = await readJsonResultsFromFile(resultsFile);
    if (!resultsJson) {
      setOutput('test-outcome', 'Failed');
      return;
    }

    const failingTestsFound = areThereAnyFailingTests(resultsJson);
    setOutput('test-outcome', failingTestsFound ? 'Failed' : 'Passed');

    const markupData = getMarkupForJson(resultsJson, reportName);

    // GitHub API has a limit of 65535 characters for a comment so truncate the markup if we need to
    const characterLimit = 65535;
    let truncated = false;
    let mdData = markupData;

    if (shouldCreatePRComment || shouldCreateStatusCheck) {
      if (mdData.length > characterLimit) {
        const message = `Truncating markup data due to character limit exceeded for GitHub API.  Markup data length: ${mdData.length}/${characterLimit}`;
        info(message);

        truncated = true;
        const truncatedMessage = `> [!Important]\n> Test results truncated due to character limit.  See full report in output.\n`;
        mdData = `${truncatedMessage}\n${mdData.substring(0, characterLimit - 100)}`;
      }
      setOutput('test-results-truncated', truncated);
    }

    if (shouldCreateStatusCheck) {
      let conclusion = 'success';
      if (!resultsJson.success) {
        conclusion = ignoreTestFailures ? 'neutral' : 'failure';
      }
      const checkId = await createStatusCheck(token, mdData, conclusion, reportName);
      setOutput('status-check-id', checkId); // This is mainly for testing purposes
    }

    if (shouldCreatePRComment) {
      info(`\nCreating a PR comment with length ${mdData.length}...`);
      const commentId = await createPrComment(token, mdData, updateCommentIfOneExists, commentIdentifier);
      setOutput('pr-comment-id', commentId); // This is mainly for testing purposes
    }

    // Create this automatically to facilitate testing
    const resultsFilePath = createResultsFile(markupData, jobAndStep);
    setOutput('test-results-file-path', resultsFilePath);
  } catch (error) {
    if (error instanceof RangeError) {
      info(error.message);
      setOutput('test-outcome', 'Failed');
      return;
    } else {
      setFailed(`An error occurred processing the jest results file: ${error.message}`);
      setOutput('test-outcome', 'Failed');
    }
  }
}

run();
