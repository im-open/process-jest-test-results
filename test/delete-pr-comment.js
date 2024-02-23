module.exports = async (github, core, commentId) => {
  core.info(`\nDeleting comment '${commentId}'`);

  if (!commentId) {
    core.setFailed(`The comment id provided was empty.`);
  }

  await github
    .request(`DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}`, {
      owner: 'im-open',
      repo: 'process-jest-test-results',
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
};
