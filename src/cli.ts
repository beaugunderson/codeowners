#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { walkStream } from "@nodelib/fs.walk";
import { program } from "commander";
import { findUpSync } from "find-up";
import ignore from "ignore";

import { Codeowners } from "./codeowners";
import { intersection, padEnd } from "./utils";

const rootPath = process.cwd();

const gitignorePath = findUpSync(".gitignore", { cwd: rootPath });
const gitignoreMatcher = ignore();

if (gitignorePath) {
  gitignoreMatcher.add(fs.readFileSync(gitignorePath).toString());
}

program.description("@nmann/codeowners cli");

program
  .command("of <file> [otherFiles...]")
  .description("list the owner of specific files")
  .action((singleFile, otherFiles) => {
    const codeowners = new Codeowners(rootPath);
    console.log(singleFile, ...codeowners.getOwner(singleFile));
    for (const file of otherFiles) {
      console.log(file, ...codeowners.getOwner(file));
    }
  });

program
  .command("audit")
  .description("list the owners for all files")
  .option("-u, --unowned", "unowned files only")
  .option(
    "-d, --min-depth <n>",
    "roll up unowned files to common paths, but to a minimum depth (only works for unowned)",
    parseInt,
  )
  .option("-w, --width <columns>", "how much should filenames be padded?", "32")
  .option(
    "-c, --codeowners-filename <codeowners_filename>",
    "specify CODEOWNERS filename",
    "CODEOWNERS",
  )
  .action((options) => {
    let codeowners: Codeowners;

    try {
      codeowners = new Codeowners(rootPath, options.codeownersFilename);
    } catch (e) {
      console.error((e as Error).message);
      process.exit(1);
    }

    const padding = parseInt(options.width, 10);

    const stream = walkStream(rootPath, {
      deepFilter: (entry) => {
        const split = entry.path.split(path.sep);
        return (
          !split.includes("node_modules") && !split.includes(".git") && !split.includes(".cache")
        );
      },
      errorFilter: (error) =>
        error.code === "ENOENT" || error.code === "EACCES" || error.code === "EPERM",
    });

    stream.on("data", (file) => {
      let relative = path
        .relative(codeowners.codeownersDirectory, file.path)
        .replace(/(\r)/g, "\\r");
      if (gitignoreMatcher.ignores(relative)) {
        return;
      }

      let owners = codeowners.getOwner(relative);

      if (options.unowned) {
        if (!owners.length) {
          if (options.minDepth) {
            while (!owners.length && relative.split(path.sep).length > options.minDepth) {
              const parentPath = path.dirname(relative);
              owners = codeowners.getOwner(parentPath);
              if (!owners.length) {
                relative = parentPath;
              } else {
                break;
              }
            }
          }

          console.log(relative);
        }
      } else {
        let printedOwner = "nobody";
        if (owners.length) {
          printedOwner = owners.join(" ");
        }
        console.log(`${padEnd(relative, padding)}    ${printedOwner}`);
      }
    });

    stream.on("error", (err) => {
      console.error(err);
    });
  });

program
  .command("verify <path> <users...>")
  .description("verify users/teams own a specific path")
  .option(
    "-c, --codeowners-filename <codeowners_filename>",
    "specify CODEOWNERS filename",
    "CODEOWNERS",
  )
  .action((checkPath, users, options) => {
    let codeowners: Codeowners;

    // instantiate new Codeowners obj
    try {
      codeowners = new Codeowners(rootPath, options.codeownersFilename);
    } catch (e) {
      console.error((e as Error).message);
      process.exit(1);
    }

    // call getOwner() on `path`
    const owners = codeowners.getOwner(checkPath);

    // check if any `users` are in the results of getOwner()
    const verifiedOwners = intersection(users, owners);

    // if verifiedOwners is empty, exit with error
    if (verifiedOwners.length < 1) {
      console.log(`None of the users/teams specified own the path ${checkPath}`);
      process.exit(1);
    }

    // print owners
    for (const currOwner of verifiedOwners) {
      console.log(`${checkPath}    ${currOwner}`);
    }
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
