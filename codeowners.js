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

  return function (fileString) {
    return matcher.ignores(fileString);
  };
}

function Codeowners(currentPath) {
  if (!currentPath) {
    currentPath = process.cwd();
  }

  this.codeownersFilePath = trueCasePath(findUp.sync('.github/CODEOWNERS', { cwd: currentPath }));

  this.codeownersDirectory = path.dirname(path.dirname(this.codeownersFilePath));
  const codeownersFile = path.basename(this.codeownersFilePath);

  if (codeownersFile !== 'CODEOWNERS') {
    throw new Error(`Found a CODEOWNERS file but it was lower-cased: ${this.codeownersFilePath}`);
  }

  if (isDirectory.sync(this.codeownersFilePath)) {
    throw new Error(`Found a CODEOWNERS but it's a directory: ${this.codeownersFilePath}`);
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
}

module.exports = Codeowners;
