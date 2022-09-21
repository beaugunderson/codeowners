# codeowners

A tool for interacting with GitHub's
[CODEOWNERS](https://help.github.com/articles/about-codeowners/) files.

Usable as a CLI, or as a library.

## installation

```sh
$ npm install -g codeowners
```

## cli usage

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

## library usage

```js
const Codeowners = require('codeowners');

// defaults to process.cwd(), but can pass a different directory path to constructor
const owners = new Codeowners();
owners.getOwner('path/to/file.js'); // => array of owner strings, e.g. ['@noahm']
```

Also has support for parsing out contact info for teams if listed in a space-separated-values format.
Any number of arbitrary columns and headers can be used, but only lines beginning with "##" will be used.
```
# Team Contact Info
# Double pound characters are special signifiers of contact metadata.
## team slack-channel engineering-manager jira-project-key
## @twilight/bits #bits @bitsmanager BITS
## @twilight/bounty-board #bounty-board @janesmith BB
```

```js
owners.contactInfo
// => array of info objects indexed by column name
[
  {
    team: '@twilight/bits',
    'slack-channel': '#bits',
    'engineering-manager': '@bitsmanager',
    'jira-project-key': 'BITS'
  },
  {
    team: '@twilight/bounty-board',
    'slack-channel': '#bounty-board',
    'engineering-manager': '@janesmith',
    'jira-project-key': 'BB'
  }
]
```

## CHANGELOG

### 5.0.0

- Much-improved performance
- Removal of automatic column width calculation
- Addition of `-w/--width` option for manual column width
  - Or use e.g. `codeowners audit | column -ts "    "`
