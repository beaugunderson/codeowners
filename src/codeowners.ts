import fs from "node:fs";
import path from "node:path";
import { findUpSync } from "find-up";
import ignore from "ignore";
import * as tcp from "true-case-path";

import { ContactInfo } from "./contact-info";
import { isDirectorySync } from "./utils";

function ownerMatcher(pathString: string) {
  const matcher = ignore().add(pathString);
  return matcher.ignores.bind(matcher);
}

const PARENT_FOLDERS = [".github", ".gitlab", "docs"];
const CODEOWNERS = "CODEOWNERS";

interface OwnerEntry {
  path: string;
  usernames: string[];
  match(pathname: string): boolean;
}

interface ReadOnlyDict<T> {
  readonly [key: string]: T | undefined;
}

/**
 * @param currentPath defaults to process.cwd()
 * @param fileName of file to find, defaults to CODEOWNERS
 */
export class Codeowners {
  readonly codeownersFilePath: string;
  readonly codeownersDirectory: string;
  readonly contactInfo: ReadonlyArray<ReadOnlyDict<string>>;

  private ownerEntries: OwnerEntry[] = [];
  private pathsByOwner: Record<string, string[]> = {};

  constructor(currentPath: string = process.cwd(), fileName: string = CODEOWNERS) {
    const contactInfo = new ContactInfo();

    const foundPath = findUpSync(
      PARENT_FOLDERS.map((folder) => path.join(folder, fileName)).concat(fileName),
      {
        cwd: currentPath,
      },
    );

    if (!foundPath) {
      throw new Error("Could not find a CODEOWNERS file");
    }

    this.codeownersFilePath = tcp.trueCasePathSync(foundPath);
    this.codeownersDirectory = path.dirname(this.codeownersFilePath);

    // We might have found a bare codeowners file or one inside the three supported subdirectories.
    // In the latter case the project root is up another level.
    if (PARENT_FOLDERS.includes(path.basename(this.codeownersDirectory))) {
      this.codeownersDirectory = path.dirname(this.codeownersDirectory);
    }

    const codeownersFile = path.basename(this.codeownersFilePath);

    if (codeownersFile !== fileName) {
      throw new Error(
        `Found a ${fileName} file but it was lower-cased: ${this.codeownersFilePath}`,
      );
    }

    if (isDirectorySync(this.codeownersFilePath)) {
      throw new Error(`Found a ${fileName} but it's a directory: ${this.codeownersFilePath}`);
    }

    const lines = fs
      .readFileSync(this.codeownersFilePath)
      .toString()
      .split(/\r\n|\r|\n/);

    for (const line of lines) {
      if (!line) {
        continue;
      }

      if (line.startsWith("##")) {
        contactInfo.addLine(line);
        continue;
      }

      if (line.startsWith("#")) {
        // ignore comment
        continue;
      }

      const [pathString, ...usernames] = line.split(/\s+/);
      const matcher = ownerMatcher(pathString);
      this.ownerEntries.push({
        path: pathString,
        usernames,
        match(pathname) {
          return matcher(path.relative(currentPath, pathname));
        },
      });
      for (const owner of usernames) {
        if (!this.pathsByOwner[owner]) {
          this.pathsByOwner[owner] = [];
        }
        this.pathsByOwner[owner].push(pathString);
      }
    }

    // reverse the owner entries to search from bottom to top
    // the last matching pattern takes the most precedence
    this.ownerEntries.reverse();
    this.contactInfo = contactInfo.owners;
  }

  getOwner(filePath: string) {
    for (const entry of this.ownerEntries) {
      if (entry.match(filePath)) {
        return [...entry.usernames];
      }
    }

    return EMPTY_ARRAY;
  }

  getPathsForOwner(owner: string) {
    if (this.pathsByOwner[owner]) {
      return this.pathsByOwner[owner].slice();
    }
    return [];
  }
}

export default Codeowners;

const EMPTY_ARRAY: never[] = [];
