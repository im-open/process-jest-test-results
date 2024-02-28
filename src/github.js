const core = require('@actions/core');
const github = require('@actions/github');

async function createStatusCheck(repoToken, markupData, conclusion, reportName) {
  core.info(`\nCreating Status check for ${reportName}...`);
  const octokit = github.getOctokit(repoToken);

  const git_sha =
    github.context.eventName === 'pull_request' ? github.context.payload.pull_request.head.sha : github.context.sha;
  const name = `status check - ${reportName.toLowerCase()}`;
  const status = 'completed';
  const checkTime = new Date().toUTCString();
  const summary = `This test run completed at \`${checkTime}\``;

  const propMessage = `  Name: ${name}
  GitSha: ${git_sha}
  Event: ${github.context.eventName}
  Status: ${status}
  Conclusion: ${conclusion}
  Check time: ${checkTime}
  Title: ${reportName}
  Summary: ${summary}`;
  core.info(propMessage);

  let statusCheckId;
  await octokit.rest.checks
    .create({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      name: name,
      head_sha: git_sha,
      status: status,
      conclusion: conclusion,
      output: {
        title: reportName,
        summary: summary,
        text: markupData
      }
    })
    .then(response => {
      core.info(`Created check: '${response.data.name}' with id '${response.data.id}'`);
      statusCheckId = response.data.id;
    })
    .catch(error => {
      core.setFailed(`An error occurred trying to create the status check: ${error.message}`);
    });
  return statusCheckId;
}

async function lookForExistingComment(octokit, markdownPrefix) {
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
        const existingComment = comments.find(c => c.body.startsWith(markdownPrefix));
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

async function createPrComment(repoToken, markdown, updateCommentIfOneExists, commentIdentifier) {
  if (github.context.eventName != 'pull_request') {
    core.info('This event was not triggered by a pull_request.  No comment will be created or updated.');
    return;
  }

  const markdownPrefix = `<!-- im-open/process-jest-test-results ${commentIdentifier} -->`;
  core.info(`The markdown prefix will be: '${markdownPrefix}'`);

  const octokit = github.getOctokit(repoToken);

  let commentIdToReturn;
  let existingCommentId = null;
  if (updateCommentIfOneExists) {
    core.info('Checking for existing comment on PR....');
    existingCommentId = await lookForExistingComment(octokit, markdownPrefix);
  }

  if (existingCommentId) {
    core.info(`Updating existing PR #${existingCommentId} comment...`);
    commentIdToReturn = existingCommentId;

    await octokit.rest.issues
      .updateComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: `${markdownPrefix}\n${markdown}`,
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
        body: `${markdownPrefix}\n${markdown}`,
        issue_number: github.context.payload.pull_request.number
      })
      .then(response => {
        core.info(`PR comment was created.  ID: ${response.data.id}.`);
        commentIdToReturn = response.data.id;
      })
      .catch(error => {
        core.setFailed(`An error occurred trying to create the PR comment: ${error.message}`);
      });
  }
  return commentIdToReturn;
}

module.exports = {
  createStatusCheck,
  createPrComment
};
