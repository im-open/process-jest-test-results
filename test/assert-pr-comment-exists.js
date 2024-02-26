module.exports = async (github, context, core, commentId) => {
  core.info(`\nAsserting that PR Comment with the following id exists: '${commentId}'`);

  let actualComment;

  if (!commentId || commentId.trim() === '') {
    core.setFailed(`The comment id provided was empty.`);
  }

  const commentResponse = await github.rest.issues.getComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    comment_id: commentId.trim()
  });

  if (!commentResponse && !commentResponse.data) {
    core.setFailed(`Comment ${commentId} does not appear to exist.`);
  } else {
    core.info(`Comment ${commentId} exists.`);
    let rawComment = commentResponse.data;

    actualComment = {
      id: rawComment.id,
      body: rawComment.body,
      createdAt: rawComment.created_at,
      updatedAt: rawComment.updated_at,
      issueUrl: rawComment.issue_url
    };
    core.startGroup(`Comment ${actualComment.id} details:`);
    console.log(actualComment);
    core.endGroup();
  }

  return actualComment;
};
