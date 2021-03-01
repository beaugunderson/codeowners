// @ts-check

const findUp = require('find-up');
const fs = require('fs');
const ignore = require('ignore');
const isDirectory = require('is-directory');
const path = require('path');
const trueCasePath = require('true-case-path');

function ownerMatcher(pathString) {
  const matcher = ignore().add(pathString);
  return matcher.ignores.bind(matcher);
}

function Codeowners(currentPath, fileName = 'CODEOWNERS') {
  const pathOrCwd = currentPath || process.cwd();

  const codeownersPath = findUp.sync(
    [`.github/${fileName}`, `.gitlab/${fileName}`, `docs/${fileName}`, `${fileName}`],
    { cwd: pathOrCwd }
  );

  if (!codeownersPath) {
    throw new Error(`Could not find a CODEOWNERS file`);
  }

  this.codeownersFilePath = trueCasePath(codeownersPath);

  this.codeownersDirectory = path.dirname(this.codeownersFilePath);

  // We might have found a bare codeowners file or one inside the three supported subdirectories.
  // In the latter case the project root is up another level.
  if (this.codeownersDirectory.match(/\/(.github|.gitlab|docs)$/i)) {
    this.codeownersDirectory = path.dirname(this.codeownersDirectory);
  }

  const codeownersFile = path.basename(this.codeownersFilePath);

  if (codeownersFile !== fileName) {
    throw new Error(`Found a ${fileName} file but it was lower-cased: ${this.codeownersFilePath}`);
  }

  if (isDirectory.sync(this.codeownersFilePath)) {
    throw new Error(`Found a ${fileName} but it's a directory: ${this.codeownersFilePath}`);
  }

  const lines = fs
    .readFileSync(this.codeownersFilePath)
    .toString()
    .split(/\r\n|\r|\n/);
  const ownerEntries = [];

  for (const line of lines) {
    if (!line) {
      continue;
    }

    if (line.startsWith('#')) {
      continue;
    }

    const [pathString, ...usernames] = line.split(/\s+/);

    ownerEntries.push({
      path: pathString,
      usernames,
      match: ownerMatcher(pathString),
    });
  }

  // reverse the owner entries to search from bottom to top
  // the last matching pattern takes the most precedence
  this.ownerEntries = ownerEntries.reverse();
}

const EMPTY_ARRAY = [];

Codeowners.prototype.getOwner = function getOwner(filePath) {
  for (const entry of this.ownerEntries) {
    if (entry.match(filePath)) {
      return entry.usernames;
    }
  }

  return EMPTY_ARRAY;
};

module.exports = Codeowners;
