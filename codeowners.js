// @ts-check

const findUp = require('find-up');
const fs = require('fs');
const ignore = require('ignore');
const isDirectory = require('is-directory');
const path = require('path');
const trueCasePath = require('true-case-path');

const ContactInfo = require('./contact-info');

function ownerMatcher(pathString) {
  const matcher = ignore().add(pathString);
  return matcher.ignores.bind(matcher);
}

const PARENT_FOLDERS = ['.github', '.gitlab', 'docs'];
const CODEOWNERS = 'CODEOWNERS';

/**
 * @param {string=} currentPath defaults to process.cwd()
 * @param {string=} fileName of file to find, defaults to CODEOWNERS
 */
function Codeowners(currentPath, fileName = CODEOWNERS) {
  if (!currentPath) {
    currentPath = process.cwd();
  }

  const contactInfo = new ContactInfo();

  this.codeownersFilePath = trueCasePath(
    findUp.sync(PARENT_FOLDERS.map((folder) => path.join(folder, fileName)).concat(fileName), {
      cwd: currentPath,
    })
  );

  if (!this.codeownersFilePath) {
    throw new Error(`Could not find a CODEOWNERS file`);
  }

  this.codeownersDirectory = path.dirname(this.codeownersFilePath);

  // We might have found a bare codeowners file or one inside the three supported subdirectories.
  // In the latter case the project root is up another level.
  if (PARENT_FOLDERS.includes(path.basename(this.codeownersDirectory))) {
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
  const pathsByOwner = {};

  for (const line of lines) {
    if (!line) {
      continue;
    }

    if (line.startsWith('##')) {
      contactInfo.addLine(line);
      continue;
    }

    if (line.startsWith('#')) {
      // ignore comment
      continue;
    }

    const [pathString, ...usernames] = line.split(/\s+/);

    ownerEntries.push({
      path: pathString,
      usernames,
      match: ownerMatcher(pathString),
    });
    for (const owner of usernames) {
      if (!pathsByOwner[owner]) {
        pathsByOwner[owner] = [];
      }
      pathsByOwner[owner].push(pathString);
    }
  }

  // reverse the owner entries to search from bottom to top
  // the last matching pattern takes the most precedence
  this.ownerEntries = ownerEntries.reverse();
  this.contactInfo = contactInfo.owners;
  this.pathsByOwner = pathsByOwner;
}

const EMPTY_ARRAY = [];

Codeowners.prototype.getOwner = function getOwner(filePath) {
  for (const entry of this.ownerEntries) {
    if (entry.match(filePath)) {
      return [...entry.usernames];
    }
  }

  return EMPTY_ARRAY;
};

Codeowners.prototype.getPathsForOwner = function (owner) {
  if (this.pathsByOwner[owner]) {
    return this.pathsByOwner[owner].slice();
  }
  return [];
};

module.exports = Codeowners;
