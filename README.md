# codeowners

A tool for interacting with GitHub's
[CODEOWNERS](https://help.github.com/articles/about-codeowners/) files.

## installation

```sh
$ npm install -g codeowners
```

## usage

To find a list of files not covered by the `CODEOWNERS` in the project:

```sh
$ codeowners audit --unowned
```
