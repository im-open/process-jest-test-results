module.exports = async (core, statusCheck, expectedValues) => {
  function assertValuesMatch(variableName, expectedValue, actualValue) {
    core.info(`\n\tExpected ${variableName}: '${expectedValue}'`);
    core.info(`\tActual ${variableName}:   '${actualValue}'`);

    if (expectedValue != actualValue) {
      core.setFailed(`\tThe expected ${variableName} does not match the actual ${variableName}.`);
    } else {
      core.info(`\tThe expected and actual ${variableName} values match.`);
    }
  }

  function assertValueContainsSubstring(variableName, value, substring) {
    core.startGroup(`\tChecking ${variableName} contains the substring.`);
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
    core.info(`\nAsserting that Status Check properties match the expected values.`);
    core.info(`Status Check: ${statusCheck.id}`);

    assertValuesMatch('Name', expectedValues['name'], statusCheck.name);
    assertValuesMatch('Status', expectedValues['status'], statusCheck.status);
    assertValuesMatch('Conclusion', expectedValues['conclusion'], statusCheck.conclusion);
    assertValuesMatch('Title', expectedValues['title'], statusCheck.title);
    assertValuesMatch('Text', expectedValues['text'], statusCheck.text);

    // The summary should be something like: 'This test run completed at `Wed, 21 Feb 2024 20:21:48 GMT`'
    // so just check that it contains the static portion.
    assertValueContainsSubstring('Summary', statusCheck.summary, 'This test run completed at `');
  }

  validateProps();
};
