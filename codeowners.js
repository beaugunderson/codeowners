// @ts-check
'use strict';

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
  if (!currentPath) {
    currentPath = process.cwd();
  }

  this.codeownersFilePath = trueCasePath(findUp.sync([
    `.github/${fileName}`, `.gitlab/${fileName}`, `docs/${fileName}`, `${fileName}`
  ], {cwd: currentPath}));

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

  const lines = fs.readFileSync(this.codeownersFilePath).toString().split('\n');
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
      usernames: usernames,
      match: ownerMatcher(pathString)
    });
  }

  this.ownerEntries = ownerEntries;
}

Codeowners.prototype.getOwner = function (filePath) {
  let owners = [];
  for (const entry of this.ownerEntries) {
    if (entry.match(filePath)) {
      owners = entry.usernames;
    }
  }
  return owners.slice();
};

module.exports = Codeowners;
