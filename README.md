# @nmann/codeowners

[![npm](https://img.shields.io/npm/v/@nmann/codeowners)](https://www.npmjs.com/package/@nmann/codeowners)

A library and CLI for interacting with GitHub's
[CODEOWNERS](https://help.github.com/articles/about-codeowners/) files.

It extends GitHubs's file format to to use the CODEOWNERS file as a source of truth for metadata about teams. This is useful for quick reference to things like preferred contact channels, JIRA project names, etc.

This metadata can be made even easier to access with [a companion VS Code extension](https://marketplace.visualstudio.com/items?itemName=noahm.codeowners-extended).

## Library usage

```js
const Codeowners = require('@nmann/codeowners');

// defaults to process.cwd(), but can pass a different directory path to constructor
const owners = new Codeowners();
owners.getOwner('path/to/file.js'); // returns array of one or more owners, e.g. ['@noahm']
```

### Team metadata

This library will attempt to parse out contact info for teams if listed in a simple space-separated-values format. Only lines beginning with a double-pound "##" will be parsed.

The first line is a space-separated list of column names, and the following lines provide values for those columns, one line per team.

Example team metadata block:

```sh
## team slack-channel engineering-manager jira-project-key
## @org/admins #project-admins @alice ADMIN
## @org/design #design @bob DESIGN
## @org/monetization #monetization-eng @charlie MONEY

# ... regular codeowners file contents ...
```

This info is parsed and made available in an array of structured objects on the `contactInfo` field of a codeowners class instance:

```js
[
  {
    team: '@org/admins',
    'slack-channel': '#project-admins',
    'engineering-manager': '@alice',
    'jira-project-key': 'ADMIN',
  },
  {
    team: '@org/design',
    'slack-channel': '#design',
    'engineering-manager': '@bob',
    'jira-project-key': 'DESIGN',
  },
  {
    team: '@org/monetization',
    'slack-channel': '#monetization-eng',
    'engineering-manager': '@charlie',
    'jira-project-key': 'MONEY',
  },
];
```

## CLI usage

Find the owner(s) of a given file or files:

```sh
$ codeowners of some/file.ts [...otherfiles]
```

Print a list of each files in the current repo, followed by its owner:

```sh
$ codeowners audit
```

To find a list of files not covered by the `CODEOWNERS` in the project:

```sh
$ codeowners audit --unowned
```

Specify a non-standard CODEOWNERS filename

```sh
$ codeowners audit -c CODEKEEPERS
```

Verify users/teams own a specific path

```sh
$ codeowners verify src/ @foob_ar @contoso/engineers
```
