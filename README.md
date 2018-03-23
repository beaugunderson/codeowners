# codeowners

A tool for interacting with GitHub's
[CODEOWNERS](https://help.github.com/articles/about-codeowners/) files.

Usable as a CLI, or as a library.

## installation

```sh
$ npm install -g codeowners
```

## cli usage

Print a list of each files in the current repo, followed by its owner:

```sh
$ codeowners audit
```

To find a list of files not covered by the `CODEOWNERS` in the project:

```sh
$ codeowners audit --unowned
```

## library usage

```js
const Codeowners = require('codeowners');

// workingDir is optional, defaults to process.cwd()
const repos = new Codeowners(workingDir);
repos.getOwner('path/to/file.js'); // => array of owner strings, e.g. ['@noahm']
```
