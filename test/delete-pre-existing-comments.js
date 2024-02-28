module.exports = async (github, context, core) => {
  async function lookForExistingComments(github, context, core, prNum) {
    const markupPrefix = `<!-- im-open/process-jest-test-results`;
    let commentsToDelete = [];

    await github
      .paginate(github.rest.issues.listComments, {
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: prNum
      })
      .then(comments => {
        if (comments.length === 0) {
          core.info('There are no comments on the PR. Nothing to delete.');
        } else {
          const existingComments = comments.filter(c => c.body.includes(markupPrefix));
          if (existingComments) {
            commentsToDelete = existingComments.map(c => c.id);
            core.info(`There are existing comments to delete: ${commentsToDelete.join(',')}`);
          } else {
            core.info('No comments were found that contain the prefix.  Nothing to delete.');
          }
        }
      })
      .catch(error => {
        core.info(
          `Failed to list PR comments. Error code: ${error.message}.  Nothing will be deleted but this may affect the test run.`
        );
      });

    core.info(`Finished getting comments for PR #${prNum}.`);

    return commentsToDelete;
  }

  async function deleteComment(github, context, core, commentId) {
    await github
      .request(`DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}`, {
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id: commentId,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
      .then(() => {
        core.info(`The comment '${commentId}' was deleted successfully.`);
      })
      .catch(error => {
        core.info(`An error occurred deleting comment '${commentId}'.  Error: ${error.message}`);
        core.info(`You may need to manually clean up the PR comments.`);
      });
  }

  const prNum = context.payload.pull_request.number;
  core.info(`\nDeleting all pre-existing process-jest-test-results comments from PR # ${prNum}...`);

  const commentsToDelete = await lookForExistingComments(github, context, core, prNum);
  if (commentsToDelete.length === 0) {
    return;
  }

  for (const commentId of commentsToDelete) {
    await deleteComment(github, context, core, commentId);
  }
};
