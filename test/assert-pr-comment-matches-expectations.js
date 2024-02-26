module.exports = async (core, comment, expectedValues) => {
  function assertLengthsAreTheSame(prCommentLength, testResultsMdLength) {
    core.info(`\n\tPR Comment length:\t\t'${prCommentLength}'`);
    core.info(`\ttest-results.md length: '${testResultsMdLength}'`);

    if (prCommentLength != testResultsMdLength) {
      core.setFailed(`\tThe lengths do not match, which is not expected.`);
    } else {
      core.info(`\tThe lengths match, which is expected.`);
    }
  }
  function assertLengthsAreNotTheSame(prCommentLength, testResultsMdLength) {
    core.info(`\n\tPR Comment length:\t\t'${prCommentLength}'`);
    core.info(`\ttest-results.md length: '${testResultsMdLength}'`);

    if (prCommentLength != testResultsMdLength) {
      core.info(`\tThe lengths do not match, which is expected.`);
    } else {
      core.setFailed(`\tThe lengths match, which is not expected.`);
    }
  }

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
    core.info(`Comment ID: ${comment.id}`);

    const expectedPrefix = expectedValues.expectedPrefix;
    const expectedBody = expectedValues.expectedBody;
    const actualTestResultsMd = expectedValues.actualTestResults;
    const actualTestResultsMdWithPrefix = `${expectedPrefix}\n${actualTestResultsMd}`;
    const actualComment = comment.body;

    // The actual comment body should contain the expected prefix and the expected body
    assertValueContainsSubstring('PR Comment', actualComment, 'Expected Prefix', expectedPrefix);
    assertValueContainsSubstring('PR Comment', actualComment, 'Expected Body', expectedBody);

    // The test-results.md file is the whole markdown before truncation so
    // it should contain the substring of the actual comment
    assertValueContainsSubstring('test-results.md', actualTestResultsMdWithPrefix, 'Actual Comment Body', actualComment);

    if (expectedValues.truncated) {
      assertLengthsAreNotTheSame(actualComment.length, actualTestResultsMdWithPrefix.length);
    } else {
      assertLengthsAreTheSame(actualComment.length, actualTestResultsMdWithPrefix.length);
    }

    // Doublecheck the timestamps are generally what we expected based on created/updated status
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
};
