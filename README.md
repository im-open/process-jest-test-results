# javascript-action-template

This template can be used to quickly start a new custom js action repository.  Click the `Use this template` button at the top to get started.

## TODOs
- Readme
  - [ ] Update the Inputs section with the correct action inputs
  - [ ] Update the Outputs section with the correct action outputs
  - [ ] Update the Example section with the correct usage   
- package.json
  - [ ] Update the `name` with the new action value
- main.js
  - [ ] Implement your custom javascript action
- action.yml
  - [ ] Fill in the correct name, description, inputs and outputs
- .prettierrc.json
  - [ ] Update any preferences you might have
- CODEOWNERS
  - [ ] Update as appropriate
- Repository Settings
  - [ ] On the *Options* tab check the box to *Automatically delete head branches*
  - [ ] On the *Options* tab update the repository's visibility (must be done by an org owner)
  - [ ] On the *Branches* tab add a branch protection rule
    - [ ] Check *Require pull request reviews before merging*
    - [ ] Check *Dismiss stale pull request approvals when new commits are pushed*
    - [ ] Check *Require review from Code Owners*
    - [ ] Check *Include Administrators*
  - [ ] On the *Manage Access* tab add the appropriate groups
- About Section (accessed on the main page of the repo, click the gear icon to edit)
  - [ ] The repo should have a short description of what it is for
  - [ ] Add one of the following topic tags:
    | Topic Tag       | Usage                                    |
    | --------------- | ---------------------------------------- |
    | az              | For actions related to Azure             |
    | code            | For actions related to building code     |
    | certs           | For actions related to certificates      |
    | db              | For actions related to databases         |
    | git             | For actions related to Git               |
    | iis             | For actions related to IIS               |
    | microsoft-teams | For actions related to Microsoft Teams   |
    | svc             | For actions related to Windows Services  |
    | jira            | For actions related to Jira              |
    | meta            | For actions related to running workflows |
    | pagerduty       | For actions related to PagerDuty         |
    | test            | For actions related to testing           |
    | tf              | For actions related to Terraform         |
  - [ ] Add any additional topics for an action if they apply    
    

## Inputs
| Parameter | Is Required | Default | Description           |
| --------- | ----------- | ------- | --------------------- |
| `input-1` | true        |         | Description goes here |
| `input-2` | false       |         | Description goes here |

## Outputs
| Output     | Description           |
| ---------- | --------------------- |
| `output-1` | Description goes here |

## Example

```yml
# TODO: Fill in the correct usage
jobs:
  job1:
    runs-on: [self-hosted, ubuntu-20.04]
    steps:
      - uses: actions/checkout@v2

      - name: Add Step Here
        uses: im-open/this-repo@v1.0.0
        with:
          input-1: 'abc'
          input-2: '123
```

## Recompiling

If changes are made to the action's code in this repository, or its dependencies, you will need to re-compile the action.

```sh
# Installs dependencies and bundles the code
npm run build

# Bundle the code (if dependencies are already installed)
npm run bundle
```

These commands utilize [esbuild](https://esbuild.github.io/getting-started/#bundling-for-node) to bundle the action and
its dependencies into a single file located in the `dist` folder.

## Code of Conduct

This project has adopted the [im-open's Code of Conduct](https://github.com/im-open/.github/blob/master/CODE_OF_CONDUCT.md).

## License

Copyright &copy; 2021, Extend Health, LLC. Code released under the [MIT license](LICENSE).
