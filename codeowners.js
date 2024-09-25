const findUp = require('find-up');
const fs = require('fs');
const path = require('path');
const ignore = require('ignore');
const isDirectory = require('is-directory');

/**
 * @param {string} pathString the path to match
 * @returns {function(): boolean}
 */
function ownerMatcher(pathString) {
  const matcher = ignore().add(pathString);
  return matcher.ignores.bind(matcher);
}

function Codeowners(currentPath, fileName = 'CODEOWNERS') {
  const pathOrCwd = currentPath || process.cwd();

  this.codeownersFilePath = findUp.sync(
    [`.github/${fileName}`, `.gitlab/${fileName}`, `docs/${fileName}`, `${fileName}`],
    { cwd: pathOrCwd },
  );

  if (!this.codeownersFilePath) {
    throw new Error(`Could not find a CODEOWNERS file`);
  }

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
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length && !line.startsWith('#'));

  const ownerSections = [];
  let currentSection = { name: null, owners: [], entries: [] };

  for (const line of lines) {
    if (line.startsWith('[')) {
      const endingBracket = line.indexOf(']');
      const name = line.substring(1, endingBracket);
      const owners = line
        .substring(endingBracket + 1, line.length)
        .trim()
        .split(/\s+/)
        .filter((v) => v.length);

      ownerSections.push(currentSection);
      currentSection = { name, owners, entries: [] };
      continue;
    }

    const [pathString, ...usernames] = line.split(/\s+/).filter((v) => v.length);

    currentSection.entries.push({
      path: pathString,
      usernames: [...usernames, ...currentSection.owners],
      match: ownerMatcher(pathString),
    });
  }

  ownerSections.push(currentSection);

  // reverse the owner entries to search from bottom to top
  // the last matching pattern takes the most precedence
  this.ownerSections = ownerSections.reverse();
}

Codeowners.prototype.getOwner = function getOwner(filePath) {
  const owners = [];
  for (const section of this.ownerSections) {
    for (const entry of section.entries) {
      if (entry.match(filePath)) {
        owners.push(...entry.usernames);
      }
    }
  }

  return owners;
};

module.exports = Codeowners;