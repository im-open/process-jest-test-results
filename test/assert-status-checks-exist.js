module.exports = async (github, core, statusCheckIds) => {
  core.info(`\nAsserting that checks with the following ids exist: '${statusCheckIds}'`);

  const actualChecks = [];
  const checkIds = statusCheckIds.split(',');
  for (const checkId of checkIds) {
    if (!checkId || checkId.trim() === '') {
      continue;
    }

    core.startGroup(`Checking for the existence of status check ${checkId}.`);
    const checkResponse = await github.rest.checks.get({
      owner: 'im-open',
      repo: 'process-jest-test-results',
      check_run_id: checkId.trim()
    });
    if (!checkResponse && !checkResponse.data) {
      core.setFailed(`Status Check ${checkId} does not appear to exist.`);
    } else {
      core.info(`Status Check ${checkId} exists.`);
      let rawCheck = checkResponse.data;

      const check = {
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
      core.info(`Check ${check.id} details:`);
      console.log(check);
      actualChecks.push(check);
    }
    core.endGroup();
  }
  return actualChecks;
};
