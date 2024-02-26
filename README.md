# process-jest-test-results

This action works in conjunction with another step that runs `jest test --json --outputFile=jest-results.json` and it parses the results from the outputted file.  This action will take the parsed results and create a Status Check or PR Comment depending on the flags set.

This action does not run the Jest tests itself and it can only process one results file at a time.

## Index <!-- omit in toc -->

- [process-jest-test-results](#process-jest-test-results)
  - [Failures](#failures)
  - [Limitations](#limitations)
  - [Action Outputs](#action-outputs)
    - [Pull Request Comment](#pull-request-comment)
    - [Pull Request Status Check](#pull-request-status-check)
    - [Workflow Run](#workflow-run)
    - [Failed Test Details](#failed-test-details)
  - [Inputs](#inputs)
  - [Outputs](#outputs)
  - [Usage Examples](#usage-examples)
    - [Using the defaults](#using-the-defaults)
    - [Specifying additional behavior](#specifying-additional-behavior)
  - [Contributing](#contributing)
    - [Incrementing the Version](#incrementing-the-version)
    - [Source Code Changes](#source-code-changes)
    - [Recompiling Manually](#recompiling-manually)
    - [Updating the README.md](#updating-the-readmemd)
  - [Code of Conduct](#code-of-conduct)
  - [License](#license)
  
## Failures

The test status & action's conclusion can be viewed in multiple places:

- In the body of a PR comment this action generates
- Next to the name of one of the status checks under the `Checks` section of a PR
- Next to the name of one of the status checks under the `Jobs` section of the workflow run
- In the body of a status check listed on the workflow run

If the test results contain failures, the status check's conclusion will be set to `failure`. If the status check is required and its conclusion is `failure` the PR cannot be merged.  If this required status check behavior is not desired, the `ignore-test-failures` input can be set and the conclusion will be marked as `neutral` if test failures are detected. The status badge that is shown in the comment or status check body will still indicate it was a `failure` though.

## Limitations

GitHub does have a size limitation of 65535 characters for a Status Check body or a PR Comment. This action would fail if the test results exceeded the GitHub [limit]. To mitigate this size issue only details for failed tests are included in the output in addition to a badge, duration info and outcome info.  If the comment still exceeds that size, it will be truncated with a note to see the remaining output in the log.

If you have multiple workflows triggered by the same `pull_request` or `push` event, GitHub creates one checksuite for that commit.  The checksuite gets assigned to one of the workflows randomly and all status checks for that commit are reported to that checksuite. That means if there are multiple workflows with the same trigger, your status checks may show on a different workflow run than the run that created them.

## Action Outputs

### Pull Request Comment

This is shown on the pull request when the `create-pr-comment` is set to `true` and there is a PR associated with the commit.
<kbd><img src="./docs/pr_comment.png"></img></kbd>

### Pull Request Status Check

This is shown on the pull request when the `create-status-check` is set to `true` and there is a PR associated with the commit.
<kbd><img src="./docs/pr_status_check.png"></img></kbd>

### Workflow Run

This is shown on the workflow run when the `create-status-check` is set to `true`.
<kbd><img src="./docs/workflow_status_check.png"></img></kbd>

### Failed Test Details

For failed test runs you can expand each failed test and view more details about the failure
<kbd><img src="./docs/failed_tests.png"></img></kbd>

## Inputs

| Parameter                      | Is Required | Default                                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|--------------------------------|-------------|--------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `github-token`                 | true        | N/A                                              | Used for the GitHub Checks API.  Value is generally: `secrets.GITHUB_TOKEN`.                                                                                                                                                                                                                                                                                                                                                                                            |
| `results-file`                 | true        | N/A                                              | The json results file generated by jest.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `report-name`                  | false       | `Jest Test Results`                              | The desired name of the report that is shown on the PR Comment and inside the Status Check.                                                                                                                                                                                                                                                                                                                                                                             |
| `create-status-check`          | false       | `true`                                           | Flag indicating whether a status check with jest test results should be generated.                                                                                                                                                                                                                                                                                                                                                                                      |
| `ignore-test-failures`         | false       | `false`                                          | If there are test failures, the check's conclusion is set to `neutral` so it will not block pull requests.<br/><br/>*Only applicable when `create-status-check` is true.*                                                                                                                                                                                                                                                                                               |
| `create-pr-comment`            | false       | `true`                                           | Flag indicating whether a PR comment with jest test results should be generated.  When `true` the default behavior is to update an existing comment if one exists.                                                                                                                                                                                                                                                                                                      |
| `update-comment-if-one-exists` | false       | `true`                                           | This flag determines whether a new comment is created or if the action updates an existing comment (*if one is found*).<br/><br/>*Only applicable when `create-pr-comment` is true.*                                                                                                                                                                                                                                                                                    |
| `comment-identifier`           | false       | `${{ env.GITHUB-JOB }}-${{ env.GITHUB-ACTION }}` | A unique identifier which will be added to the generated markdown as a comment (*it will not be visible in the PR comment*).<br/><br/>This identifier enables creating then updating separate results comments on the PR if more than one instance of this action is included in a single job. This can be helpful when there are multiple test projects that run separately but are part of the same job.<br/><br/>*Only applicable when `create-pr-comment` is true.* |
| `timezone`                     | false       | `UTC`                                            | IANA time zone name (e.g. America/Denver) to display dates in.                                                                                                                                                                                                                                                                                                                                                                                                          |

## Outputs

| Output                   | Description                                                                                                                                                           |
|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `test-outcome`           | Test outcome based on presence of failing tests: *Failed,Passed*<br/>If exceptions are thrown or if it exits early because of argument errors, this is set to Failed. |
| `test-results-truncated` | Flag indicating whether test results were truncated due to markdown exceeding character limit of 65535.                                                               |
| `test-results-file-path` | File path for the file that contains the pre-truncated test results in markdown format.  This is the same output that is posted in the PR comment.                    |
| `status-check-id`        | The ID of the Status Check that was created.  This is only set if `create-status-check` is `true` and a status check was created successfully.                        |
| `pr-comment-id`          | The ID of the PR comment that was created.  This is only set if `create-pr-comment` is `true` and a PR was created successfully.                                      |

## Usage Examples

### Using the defaults

```yml
jobs:
  ci:
    runs-on: [ubuntu-20.04]
    permissions:
      contents: read
      checks: write
      statuses: write
      pull-requests: write

    steps:
      - uses: actions/checkout@v3

      - name: jest test with Coverage
        continue-on-error: true
        working-directory: 'src/ProjectWithJestTests' 
        run: jest --json --outputFile=jest-results.json

      - name: Process jest results with default
        if: always()
        # You may also reference just the major or major.minor version
        uses: im-open/process-jest-test-results@v2.2.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          results-file: 'src/ProjectWithJestTests/jest-results.json
```

### Specifying additional behavior

```yml
jobs:
  advanced-ci:
    runs-on: [ubuntu-20.04]
    steps:
      - uses: actions/checkout@v3

      - name: jest test with results file
        continue-on-error: true
        working-directory: 'src/ProjectWithJestTests' 
        run: jest --json --outputFile=../../jest.json
      
      - name: Process jest results
        id: process-jest
        uses: im-open/process-jest-test-results@v2.2.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          results-file: 'jest.json'
          report-name: 'Jest Results'
          create-status-check: true
          create-pr-comment: false
          update-comment-if-one-exists: false
          ignore-test-failures: true
          timezone: 'america/denver'
      
      - run: ./do-other-things-in-the-build.sh

      - name: Fail if there were errors in the jest tests
        if: steps.process-jest.outputs.test-outcome == 'Failed'
        run: |
          echo "There were test failures."
          exit 1
```

## Contributing

When creating PRs, please review the following guidelines:

- [ ] The action code does not contain sensitive information.
- [ ] At least one of the commit messages contains the appropriate `+semver:` keywords listed under [Incrementing the Version] for major and minor increments.
- [ ] The action has been recompiled.  See [Recompiling Manually] for details.
- [ ] The README.md has been updated with the latest version of the action.  See [Updating the README.md] for details.

### Incrementing the Version

This repo uses [git-version-lite] in its workflows to examine commit messages to determine whether to perform a major, minor or patch increment on merge if [source code] changes have been made.  The following table provides the fragment that should be included in a commit message to active different increment strategies.

| Increment Type | Commit Message Fragment                     |
|----------------|---------------------------------------------|
| major          | +semver:breaking                            |
| major          | +semver:major                               |
| minor          | +semver:feature                             |
| minor          | +semver:minor                               |
| patch          | *default increment type, no comment needed* |

### Source Code Changes

The files and directories that are considered source code are listed in the `files-with-code` and `dirs-with-code` arguments in both the [build-and-review-pr] and [increment-version-on-merge] workflows.  

If a PR contains source code changes, the README.md should be updated with the latest action version and the action should be recompiled.  The [build-and-review-pr] workflow will ensure these steps are performed when they are required.  The workflow will provide instructions for completing these steps if the PR Author does not initially complete them.

If a PR consists solely of non-source code changes like changes to the `README.md` or workflows under `./.github/workflows`, version updates and recompiles do not need to be performed.

### Recompiling Manually

This command utilizes [esbuild] to bundle the action and its dependencies into a single file located in the `dist` folder.  If changes are made to the action's [source code], the action must be recompiled by running the following command:

```sh
# Installs dependencies and bundles the code
npm run build
```

### Updating the README.md

If changes are made to the action's [source code], the [usage examples] section of this file should be updated with the next version of the action.  Each instance of this action should be updated.  This helps users know what the latest tag is without having to navigate to the Tags page of the repository.  See [Incrementing the Version] for details on how to determine what the next version will be or consult the first workflow run for the PR which will also calculate the next version.

## Code of Conduct

This project has adopted the [im-open's Code of Conduct](https://github.com/im-open/.github/blob/main/CODE_OF_CONDUCT.md).

## License

Copyright &copy; 2024, Extend Health, LLC. Code released under the [MIT license](LICENSE).

<!-- Links -->
[Incrementing the Version]: #incrementing-the-version
[Recompiling Manually]: #recompiling-manually
[Updating the README.md]: #updating-the-readmemd
[source code]: #source-code-changes
[usage examples]: #usage-examples
[build-and-review-pr]: ./.github/workflows/build-and-review-pr.yml
[increment-version-on-merge]: ./.github/workflows/increment-version-on-merge.yml
[esbuild]: https://esbuild.github.io/getting-started/#bundling-for-node
[git-version-lite]: https://github.com/im-open/git-version-lite
[limit]: https://github.com/github/docs/issues/3765
