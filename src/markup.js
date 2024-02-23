const core = require('@actions/core');
const { format, utcToZonedTime } = require('date-fns-tz');
const timezone = core.getInput('timezone') || 'Etc/UTC';

function getMarkupForJson(results, reportName) {
  return `# ${reportName}

${getBadge(results)}
${getTestTimes(results)}
${getTestCounters(results)}
${getFailedAndEmptyTestResultsMarkup(results)}`;
}

function getBadge(results) {
  const failedCount = results.numFailedTests;
  const passedCount = results.numPassedTests;
  const totalCount = results.numTotalTests;

  const badgeCountText = failedCount > 0 ? `${`${failedCount}/${totalCount}`}` : `${`${passedCount}/${totalCount}`}`;
  const badgeStatusText = failedCount > 0 || !results.success ? 'FAILED' : 'PASSED';
  const badgeColor = failedCount > 0 || !results.success ? 'red' : 'brightgreen';

  return `![Generic badge](https://img.shields.io/badge/${badgeCountText}-${badgeStatusText}-${badgeColor}.svg)`;
}

function formatDate(dateToFormat) {
  if (timezone && timezone.length > 0) {
    let dateWithTimezone = utcToZonedTime(dateToFormat, timezone);
    return `${format(dateWithTimezone, 'yyyy-MM-dd HH:mm:ss.SSS zzz', { timeZone: timezone })}`;
  } else {
    return format(dateToFormat, 'yyyy-MM-dd HH:mm:ss.SSS zzz');
  }
}

function getTestTimes(results) {
  let hasTests = results.testResults && results.testResults.length > 0;
  if (!hasTests) {
    return '';
  }

  let startSeconds = results.startTime;
  let endSeconds = results.testResults
    .map(m => m.endTime)
    .sort((a, b) => {
      return b - a;
    })[0];
  const duration = (endSeconds - startSeconds) / 1000;

  let startDate = new Date(startSeconds);
  let endDate = new Date(endSeconds);

  return `<details>
  <summary>Duration: ${duration} seconds</summary>
  <table>
    <tr>
      <th>Start:</th>
      <td><code>${formatDate(startDate)}</code></td>
    </tr>
    <tr>
      <th>Finish:</th>
      <td><code>${formatDate(endDate)}</code></td>
    </tr>
    <tr>
      <th>Duration:</th>
      <td><code>${duration} seconds</code></td>
    </tr>
  </table>
</details>`;
}

function getTestCounters(results) {
  let extraProps = getTableRowIfHasValue('Pending Test Suites:', results.numPendingTestSuites);
  extraProps += getTableRowIfHasValue('Pending Tests:', results.numPendingTests);
  extraProps += getTableRowIfHasValue('Runtime Error Test Suites:', results.numRuntimeErrorTestSuites);
  extraProps += getTableRowIfHasValue('TODO Tests:', results.numTodoTests);
  let outcome = results.success ? 'Passed' : 'Failed';
  return `<details>
  <summary>Outcome: ${outcome} | Total Tests: ${results.numTotalTests} | Passed: ${results.numPassedTests} | Failed: ${results.numFailedTests}</summary>
  <table>
    <tr>
      <th>Total Test Suites:</th>
      <td>${results.numTotalTestSuites}</td>
    </tr>
    <tr>
      <th>Total Tests:</th>
      <td>${results.numTotalTests}</td>
    </tr>
    <tr>
      <th>Failed Test Suites:</th>
      <td>${results.numFailedTestSuites}</td>
    </tr>
    <tr>
      <th>Failed Tests:</th>
      <td>${results.numFailedTests}</td>
    </tr>
    <tr>
      <th>Passed Test Suites:</th>
      <td>${results.numPassedTestSuites}</td>
    </tr>
    <tr>
      <th>Passed Tests:</th>
      <td>${results.numPassedTests}</td>
    </tr>${extraProps}
  </table>
</details>`;
}

function getTableRowIfHasValue(heading, data) {
  if (data > 0) {
    return `
<tr>
  <th>${heading}</th>
  <td>${data}</td>
</tr>`;
  }
  return '';
}

function getFailedAndEmptyTestResultsMarkup(results, reportName) {
  let resultsMarkup = '';

  if (!results.testResults || results.testResults.length === 0) {
    return getNoResultsMarkup(reportName);
  } else {
    let failedTests = results.testResults
      .map(o => o.assertionResults)
      .flat()
      .filter(a => a && a.status === 'failed');
    failedTests.forEach(failedTest => {
      resultsMarkup += getFailedTestMarkup(failedTest);
    });
    return resultsMarkup;
  }
}

function getNoResultsMarkup(reportName) {
  const testResultIcon = ':grey_question:';
  const resultsMarkup = `
## ${testResultIcon} ${reportName}

There were no test results to report.
`;
  return resultsMarkup;
}

function getFailedTestMarkup(failedTest) {
  core.debug(`Processing ${failedTest.fullName}`);

  //Replace an escaped unicode "escape character".  It doesn't show correctly in markdown.
  let failedMsg = failedTest.failureMessages.join('\n').replace(/\u001b\[\d{1,2}m/gi, '');
  return `<details>
  <summary>:x: ${failedTest.fullName}</summary>
  <table>
    <tr>
      <th>Title:</th>
      <td><code>${failedTest.title}</code></td>
    </tr>
    <tr>
      <th>Status:</th>
      <td><code>${failedTest.status}</code></td>
    </tr>
    <tr>
      <th>Location:</th>
      <td><code>${failedTest.location}</code></td>
    </tr>
    <tr>
      <th>Failure Messages:</th>
      <td><pre>${failedMsg}</pre></td>
    </tr>
  </table>
</details>
`;
}

module.exports = {
  getMarkupForJson
};
