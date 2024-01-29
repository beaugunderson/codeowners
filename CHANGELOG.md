# Changelog

## v2.0.2

- Fix: import style used for `true-case-path` broke when using Node's esm mode directly

## v2.0.1

- Fix: write standalone definition for bun's `ReadOnlyDict` type

## v2.0.0

- **BREAKING** Package is now ESM, the `Codeowners` class is both a named and default export

### Internal

Complete rewrite into modern tools:

- Source code is now typescript
- Local dev and test using [bun](https://bun.sh/)
- Lint and formatting with [biome](https://biomejs.dev/)
- Adds status checks and publish via github actions

## v1.0.0

Initial release forked from v5.0.0 of [Beau's codeowners package](https://github.com/beaugunderson/codeowners)

- Added ability to parse out team metadata from a block of "double commented" (`##`) lines. See [more info in the readme](README.md#team-metadata)
