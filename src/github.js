import { info, setFailed } from '@actions/core';
import { getOctokit, context } from '@actions/github';

async function createStatusCheck(repoToken, markupData, conclusion, reportName) {
  info(`\nCreating Status check for ${reportName}...`);
  const octokit = getOctokit(repoToken);

  const git_sha = context.eventName === 'pull_request' ? context.payload.pull_request.head.sha : context.sha;
  const name = `status check - ${reportName.toLowerCase()}`;
  const status = 'completed';
  const checkTime = new Date().toUTCString();
  const summary = `This test run completed at \`${checkTime}\``;

  const propMessage = `  Name: ${name}
  GitSha: ${git_sha}
  Event: ${context.eventName}
  Status: ${status}
  Conclusion: ${conclusion}
  Check time: ${checkTime}
  Title: ${reportName}
  Summary: ${summary}`;
  info(propMessage);

  let statusCheckId;
  await octokit.rest.checks
    .create({
      owner: context.repo.owner,
      repo: context.repo.repo,
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
      info(`Created check: '${response.data.name}' with id '${response.data.id}'`);
      statusCheckId = response.data.id;
    })
    .catch(error => {
      setFailed(`An error occurred trying to create the status check: ${error.message}`);
    });
  return statusCheckId;
}

async function lookForExistingComment(octokit, markdownPrefix) {
  let commentId = null;

  await octokit
    .paginate(octokit.rest.issues.listComments, {
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.pull_request.number
    })
    .then(comments => {
      if (comments.length === 0) {
        info('There are no comments on the PR.  A new comment will be created.');
      } else {
        const existingComment = comments.find(c => c.body.startsWith(markdownPrefix));
        if (existingComment) {
          info(`An existing comment (${existingComment.id}) was found and will be updated.`);
          commentId = existingComment.id;
        } else {
          info('No comments were found.  A new comment will be created.');
        }
      }
    })
    .catch(error => {
      info(`Failed to list PR comments. Error code: ${error.message}.  A new comment will be created.`);
    });

  info(`Finished getting comments for PR #${context.payload.pull_request.number}.`);

  return commentId;
}

async function createPrComment(repoToken, markdown, updateCommentIfOneExists, commentIdentifier) {
  if (context.eventName != 'pull_request') {
    info('This event was not triggered by a pull_request.  No comment will be created or updated.');
    return;
  }

  const markdownPrefix = `<!-- im-open/process-jest-test-results ${commentIdentifier} -->`;
  info(`The markdown prefix will be: '${markdownPrefix}'`);

  const octokit = getOctokit(repoToken);

  let commentIdToReturn;
  let existingCommentId = null;
  if (updateCommentIfOneExists) {
    info('Checking for existing comment on PR....');
    existingCommentId = await lookForExistingComment(octokit, markdownPrefix);
  }

  if (existingCommentId) {
    info(`Updating existing PR #${existingCommentId} comment...`);
    commentIdToReturn = existingCommentId;

    await octokit.rest.issues
      .updateComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `${markdownPrefix}\n${markdown}`,
        comment_id: existingCommentId
      })
      .then(response => {
        info(`PR comment was updated.  ID: ${response.data.id}.`);
      })
      .catch(error => {
        setFailed(`An error occurred trying to update the PR comment: ${error.message}`);
      });
  } else {
    info(`Creating a new PR comment...`);
    await octokit.rest.issues
      .createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `${markdownPrefix}\n${markdown}`,
        issue_number: context.payload.pull_request.number
      })
      .then(response => {
        info(`PR comment was created.  ID: ${response.data.id}.`);
        commentIdToReturn = response.data.id;
      })
      .catch(error => {
        setFailed(`An error occurred trying to create the PR comment: ${error.message}`);
      });
  }
  return commentIdToReturn;
}

export { createStatusCheck, createPrComment };
