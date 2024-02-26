module.exports = async (github, context, core, statusCheckId) => {
  core.info(`\nUpdate purposely failing status checks: '${statusCheckId}'`);

  if (!statusCheckId || statusCheckId.trim() === '') {
    return;
  }

  let actualCheck;
  await github.rest.checks
    .get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      check_run_id: statusCheckId
    })
    .then(response => {
      core.info(`Status Check ${statusCheckId} exists.`);
      actualCheck = response.data;
    })
    .catch(error => {
      core.setFailed(`An error occurred retrieving status check ${statusCheckId}.  Error: ${error.message}`);
    });

  if (!actualCheck) {
    core.info('Returning since status check was not found.');
    return;
  }

  const updatedText = `> [!IMPORTANT]
> This status check was purposely created with a \`failure\` conclusion.  We don't want this to prevent the PR from being merged though, so change the conclusion to \`neutral\` after the tests have run.
${actualCheck.output.text}`;
  await github.rest.checks
    .update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      check_run_id: statusCheckId,
      name: `${actualCheck.name} - UPDATED`,
      conclusion: 'neutral',
      output: {
        title: `${actualCheck.output.title}`,
        summary: `${actualCheck.output.summary}`,
        text: updatedText
      }
    })
    .then(() => {
      core.info(`The status check '${statusCheckId}' was updated successfully.`);
    })
    .catch(error => {
      core.info(`An error occurred updating status check '${statusCheckId}'.  Error: ${error.message}`);
      core.info(`This status check can be ignored when determining whether the PR is ready to merge.`);
    });
};
