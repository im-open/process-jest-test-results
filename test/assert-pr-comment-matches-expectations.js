module.exports = async (core, actualComment, actualTestResults, expectedComment) => {
  function assertCreatedAndUpdatedMatch(created, updated) {
    core.info(`\n\tCreated: '${created}'`);
    core.info(`\tUpdated:   '${updated}'`);

    if (created != updated) {
      core.setFailed(`\tThe created and updated dates do not match, which is NOT expected.`);
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

  function assertValueContainsSubstring(valueName, value, substringName, substring) {
    if (value.includes(substring)) {
      core.info(`\n\tChecking ${valueName} contains the ${substringName} substring.`);
      core.info(`\tThe ${valueName} string contains the substring.`);
    } else {
      core.info(`\n\tChecking ${valueName} contains the ${substringName} substring.`);
      core.setFailed(`\tThe ${valueName} string does not contain the ${substringName} substring.`);
      core.startGroup('\tString and substring Details');
      core.info(`\n\t${valueName}: '${value}'`);
      core.info(`\t${substringName}: '${substring}'`);
      core.endGroup();
    }
  }

  function validateProps() {
    core.info(`\nAsserting that PR Comment properties match the expected values.`);

    const expectedPrefix = expectedComment.prefix;
    const expectedFullMd = expectedComment.fullMarkdown;
    const expectedTruncatedMd = expectedComment.truncatedMarkdown;
    const isTruncated = expectedComment.truncated;

    // Check the actual comment's body
    assertValueContainsSubstring('PR Comment', actualComment.body, 'Expected Prefix', expectedPrefix);
    if (isTruncated) {
      assertValueContainsSubstring('PR Comment', actualComment.body, 'Expected Body', expectedTruncatedMd);
    } else {
      assertValueContainsSubstring('PR Comment', actualComment.body, 'Expected Body', expectedFullMd);
    }

    // Check the test-results.md file
    assertValueContainsSubstring('test-results.md', actualTestResults, 'Expected Body', expectedFullMd);

    // Doublecheck the timestamps are generally what we expected based on created/updated status
    switch (expectedComment.action) {
      case 'updated':
        assertUpdatedIsAfterCreated(actualComment.createdAt, actualComment.updatedAt);
        break;
      case 'created':
        assertCreatedAndUpdatedMatch(actualComment.createdAt, actualComment.updatedAt);
        break;
      default:
        core.setFailed(`The action '${expectedComment.action}' is not supported.`);
        break;
    }
  }

  validateProps();
};
