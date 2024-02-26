module.exports = async (github, context, core, statusCheckId) => {
  core.info(`\nAsserting that status check '${statusCheckId} exists`);

  if (!statusCheckId || statusCheckId.trim() === '') {
    core.setFailed('The statusCheckId was not provided');
    return;
  }

  let statusCheckToReturn;
  await github.rest.checks
    .get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      check_run_id: statusCheckId.trim()
    })
    .then(checkResponse => {
      core.info(`Status Check ${statusCheckId} exists.`);
      const rawCheck = checkResponse.data;

      statusCheckToReturn = {
        id: rawCheck.id,
        name: rawCheck.name,
        status: rawCheck.status,
        conclusion: rawCheck.conclusion,
        startedAt: rawCheck.started_at,
        completedAt: rawCheck.completed_at,
        title: rawCheck.output.title,
        summary: rawCheck.output.summary,
        prNumber: rawCheck.pull_requests.length > 0 ? rawCheck.pull_requests[0].number : null,
        text: rawCheck.output.text
      };
      core.startGroup(`Check ${statusCheckId} details:`);
      console.log(statusCheckToReturn);
      core.endGroup();
    })
    .catch(error => {
      core.setFailed(`An error occurred retrieving status check ${statusCheckId}.  Error: ${error.message}`);
    });

  return statusCheckToReturn;
};
