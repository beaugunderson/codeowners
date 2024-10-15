import findUp from "find-up";
import fs from "fs";
import path from "path";
import ignore from "ignore";
import isDirectory from "is-directory";

const SECTION_REGEX = /\[([^\]]*)\](?:\[(\d+)\])?([^#]*)(?:#(.*))?/;
const ENTRY_REGEX = /^((?:\\\s|[^\s])*)\s?([^#]*)(#.*)?$/;

/**
 * @param {string} pathString the path to match
 * @returns {function(): boolean}
 */
function ownerMatcher(pathString) {
  const matcher = ignore().add(pathString);
  return matcher.ignores.bind(matcher);
}

export default function Codeowners(currentPath, fileName = "CODEOWNERS") {
  const pathOrCwd = currentPath || process.cwd();

  this.codeownersFilePath = findUp.sync(
    [
      `.github/${fileName}`,
      `.gitlab/${fileName}`,
      `docs/${fileName}`,
      `${fileName}`,
    ],
    { cwd: pathOrCwd }
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
    throw new Error(
      `Found a ${fileName} file but it was lower-cased: ${this.codeownersFilePath}`
    );
  }

  if (isDirectory.sync(this.codeownersFilePath)) {
    throw new Error(
      `Found a ${fileName} but it's a directory: ${this.codeownersFilePath}`
    );
  }

  const lines = fs
    .readFileSync(this.codeownersFilePath)
    .toString()
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length && !line.startsWith("#"));

  const ownerSections = [];
  let currentSection = { name: null, owners: [], entries: [] };

  for (const line of lines) {
    if (SECTION_REGEX.test(line)) {
      const groups = SECTION_REGEX.exec(line);
      const name = groups[1];
      const owners = (groups[3] || "").split(/\s+/).filter((v) => v.length);

      ownerSections.push(currentSection);
      currentSection = { name, owners, entries: [] };
      continue;
    }
    if (ENTRY_REGEX.test(line)) {
      const groups = ENTRY_REGEX.exec(line);
      const pathString = groups[1].replace(/\\\s/g, " ");
      const usernames = (groups[2] || "").split(/\s+/).filter((v) => v.length);

      currentSection.entries.push({
        path: pathString,
        usernames: usernames.length
          ? [...usernames]
          : [...currentSection.owners],
        match: ownerMatcher(pathString),
      });
      continue;
    }
    console.error(`Could not parse line: ${line}`);
  }

  ownerSections.push(currentSection);

  // reverse the owner entries to search from bottom to top
  // the last matching pattern takes the most precedence
  this.ownerSections = ownerSections.reverse();
}

Codeowners.prototype.getOwner = function getOwner(filePath) {
  for (const section of this.ownerSections) {
    const owners = [];
    for (const entry of section.entries) {
      if (entry.match(filePath)) {
        owners.push(...entry.usernames);
      }
    }
    if (owners.length) {
      return [...new Set(owners)];
    }
  }

  return [];
};
