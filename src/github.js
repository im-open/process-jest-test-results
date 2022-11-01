const core = require('@actions/core');
const github = require('@actions/github');
const markupPrefix = '<!-- im-open/process-jest-test-results -->';

async function createStatusCheck(repoToken, markupData, conclusion, reportName) {
  core.info(`Creating Status check for ${reportName}...`);
  const octokit = github.getOctokit(repoToken);

  const git_sha =
    github.context.eventName === 'pull_request' ? github.context.payload.pull_request.head.sha : github.context.sha;
  core.info(`Creating status check for GitSha: ${git_sha} on a ${github.context.eventName} event.`);

  const checkTime = new Date().toUTCString();
  core.info(`Check time is: ${checkTime}`);

  await octokit.rest.checks
    .create({
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
    })
    .then(response => {
      core.info(`Created check: ${response.data.name}`);
    })
    .catch(error => {
      core.setFailed(`An error occurred trying to create the status check: ${error.message}`);
    });
}

async function lookForExistingComment(octokit) {
  let commentId = null;

  await octokit
    .paginate(octokit.rest.issues.listComments, {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.payload.pull_request.number
    })
    .then(comments => {
      if (comments.length === 0) {
        core.info('There are no comments on the PR.  A new comment will be created.');
      } else {
        const existingComment = comments.find(c => c.body.startsWith(markupPrefix));
        if (existingComment) {
          core.info(`An existing comment (${existingComment.id}) was found and will be updated.`);
          commentId = existingComment.id;
        } else {
          core.info('No comments were found.  A new comment will be created.');
        }
      }
    })
    .catch(error => {
      core.info(`Failed to list PR comments. Error code: ${error.message}.  A new comment will be created.`);
    });

  core.info(`Finished getting comments for PR #${github.context.payload.pull_request.number}.`);

  return commentId;
}

async function createPrComment(repoToken, markupData, updateCommentIfOneExists) {
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

  if (existingCommentId) {
    core.info(`Updating existing PR #${existingCommentId} comment...`);
    await octokit.rest.issues
      .updateComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: `${markupPrefix}\n${markupData}`,
        comment_id: existingCommentId
      })
      .then(response => {
        core.info(`PR comment was updated.  ID: ${response.data.id}.`);
      })
      .catch(error => {
        core.setFailed(`An error occurred trying to update the PR comment: ${error.message}`);
      });
  } else {
    core.info(`Creating a new PR comment...`);
    await octokit.rest.issues
      .createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: `${markupPrefix}\n${markupData}`,
        issue_number: github.context.payload.pull_request.number
      })
      .then(response => {
        core.info(`PR comment was created.  ID: ${response.data.id}.`);
      })
      .catch(error => {
        core.setFailed(`An error occurred trying to create the PR comment: ${error.message}`);
      });
  }
}

module.exports = {
  createStatusCheck,
  createPrComment
};
