module.exports = async (core, comment, expectedValues) => {
  function assertCreatedAndUpdatedMatch(created, updated) {
    core.info(`\n\tCreated: '${created}'`);
    core.info(`\tUpdated:   '${updated}'`);

    if (created != updated) {
      core.setFailed(`\tThe created and updated dates should match, which is NOT expected.`);
    } else {
      core.info(`\tThe created and updated dates match, which is expected.`);
    }
  }

  function assertUpdatedIsAfterCreated(created, updated) {
    core.info(`\n\tCreated: '${created}'`);
    core.info(`\tUpdated:   '${updated}'`);

    if (created >= updated) {
      core.setFailed(`\tThe created date is on or after the updated date, which is NOT expected.`);
    } else {
      core.info(`\tThe created date is before the updated date, which is expected.`);
    }
  }

  function assertValueContainsSubstring(variableName, value, substring) {
    core.startGroup(`\n\tChecking ${variableName} contains the substring.`);
    if (value.includes(substring)) {
      core.info(`\tThe ${variableName} string contains the substring.`);
    } else {
      core.setFailed(`\tThe ${variableName} string does not contain the substring.`);
      core.info(`\n\tExpected ${variableName}: '${value}'`);
      core.info(`\tActual ${variableName}:   '${substring}'`);
    }
    core.endGroup();
  }

  function validateProps() {
    core.info(`\nAsserting that PR Comment properties match the expected values.`);
    core.info(`Comment ID: ${comment.id}`);

    assertValueContainsSubstring('Body', expectedValues['prefixAndBody'], comment.body);

    switch (expectedValues.action) {
      case 'updated':
        assertUpdatedIsAfterCreated(comment.createdAt, comment.updatedAt);
        break;
      case 'created':
        assertCreatedAndUpdatedMatch(comment.createdAt, comment.updatedAt);
        break;
      default:
        core.setFailed(`The action '${expectedValues.action}' is not supported.`);
        break;
    }
  }

  validateProps();
  await new Promise(r => setTimeout(r, 5 * 1000));
};
