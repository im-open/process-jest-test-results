const core = require('@actions/core');
const github = require('@actions/github');
const markupPrefix = '<!-- im-open/process-jest-test-results -->';

async function createStatusCheck(repoToken, markupData, conclusion, reportName) {
  try {
    core.info(`Creating Status check for ${reportName}...`);
    const octokit = github.getOctokit(repoToken);

    let git_sha =
      github.context.eventName === 'pull_request' ? github.context.payload.pull_request.head.sha : github.context.sha;
    core.info(`Creating status check for GitSha: ${git_sha} on a ${github.context.eventName} event.`);

    const checkTime = new Date().toUTCString();
    core.info(`Check time is: ${checkTime}`);

    const response = await octokit.rest.checks.create({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      name: `status check - ${reportName.toLowerCase()}`,
      head_sha: git_sha,
      status: 'completed',
      conclusion: conclusion,
      output: {
        title: reportName,
        summary: `This test run completed at \`${checkTime}\``,
        text: markupData
      }
    });

    if (response.status !== 201) {
      throw new Error(`Failed to create status check. Error code: ${response.status}`);
    } else {
      core.info(`Created check: ${response.data.name} with response status ${response.status}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function lookForExistingComment(octokit) {
  const commentsResponse = await octokit.rest.issues.listComments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: github.context.payload.pull_request.number
  });

  if (commentsResponse.status !== 200) {
    core.info(`Failed to list PR comments. Error code: ${commentsResponse.status}.  Will create new comment instead.`);
    return null;
  }

  const existingComment = commentsResponse.data.find(c => c.body.startsWith(markupPrefix));
  if (!existingComment) {
    core.info('An existing jest test results comment was not found, create a new one instead.');
  }
  return existingComment ? existingComment.id : null;
}

async function createPrComment(repoToken, markupData, updateCommentIfOneExists) {
  try {
    if (github.context.eventName != 'pull_request') {
      core.info('This event was not triggered by a pull_request.  No comment will be created or updated.');
      return;
    }

    const octokit = github.getOctokit(repoToken);

    let existingCommentId = null;
    if (updateCommentIfOneExists) {
      core.info('Checking for existing comment on PR....');
      existingCommentId = await lookForExistingComment(octokit);
    }
    ``;
    let response;
    let success;
    if (existingCommentId) {
      core.info(`Updating existing PR #${existingCommentId} comment...`);
      response = await octokit.rest.issues.updateComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: `${markupPrefix}\n${markupData}`,
        comment_id: existingCommentId
      });
      success = response.status === 200;
    } else {
      core.info(`Creating a new PR comment...`);
      response = await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: `${markupPrefix}\n${markupData}`,
        issue_number: github.context.payload.pull_request.number
      });
      success = response.status === 201;
    }

    let action = existingCommentId ? 'create' : 'update';
    if (success) {
      core.info(`PR comment was ${action}d.  ID: ${response.data.id}.`);
    } else {
      core.setFailed(`Failed to ${action} PR comment. Error code: ${response.status}.`);
    }
  } catch (error) {
    core.setFailed(`An error occurred trying to create or update the PR comment: ${error}`);
  }
}

module.exports = {
  createStatusCheck,
  createPrComment
};
