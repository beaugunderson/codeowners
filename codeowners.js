#!/usr/bin/env node

'use strict';

const findUp = require('find-up');
const fs = require('fs');
const ignore = require('ignore');
const isDirectory = require('is-directory');
const maxBy = require('lodash.maxby');
const padEnd = require('lodash.padend');
const path = require('path');
const program = require('commander');
const recursive = require('recursive-readdir');
const trueCasePath = require('true-case-path');

const codeownersPath = findUp.sync('CODEOWNERS', {cwd: process.cwd()});
const trueCaseCodeownersPath = trueCasePath(codeownersPath);

const codeownersDirectory = path.dirname(trueCaseCodeownersPath);
const codeownersFile = path.basename(trueCaseCodeownersPath);

// TODO make a command-line option, and find .git
const rootPath = process.cwd();

function ownerMatcher(pathString) {
  const matcher = ignore().add(pathString);

  return function (fileString) {
    return matcher.ignores(fileString);
  };
}

const gitignorePath = findUp.sync('.gitignore', {cwd: rootPath});
const gitignoreMatcher = ignore();

if (gitignorePath) {
  gitignoreMatcher.add(fs.readFileSync(gitignorePath).toString());
}

if (codeownersFile !== 'CODEOWNERS') {
  console.log(`Found a CODEOWNERS file but it was lower-cased: ${trueCaseCodeownersPath}`);

  process.exit(1);
}

if (isDirectory.sync(trueCaseCodeownersPath)) {
  console.error(`Found a CODEOWNERS but it's a directory: ${trueCaseCodeownersPath}`);

  process.exit(1);
}

const lines = fs.readFileSync(trueCaseCodeownersPath).toString().split('\n');
const ownerEntries = [];

lines.forEach(line => {
  if (!line) {
    return;
  }

  if (line.startsWith('#')) {
    return;
  }

  const [pathString, ...usernames] = line.split(/\s+/);

  ownerEntries.push({
    path: pathString,
    usernames: usernames,
    match: ownerMatcher(pathString)
  });
});

program
  .command('audit')
  .description('list the owners for all files')
  .option('-u, --unowned', 'unowned files only')
  .action(options => {
    recursive(rootPath, ['.git', 'node_modules'], (err, files) => {
      if (err) {
        console.error(err);

        process.exit(1);
      }

      const filteredFiles = gitignoreMatcher.filter(files).sort();
      const relativeFiles = filteredFiles.map(file => path.relative(codeownersDirectory, file));
      const maxLength = maxBy(relativeFiles, file => file.length).length;

      relativeFiles.forEach(file => {
        let ownerEntry;
        let owners = 'none';

        ownerEntries.forEach(entry => {
          if (entry.match(file)) {
            ownerEntry = entry;
          }
        });

        if (options.unowned) {
          if (!ownerEntry) {
            return console.log(file);
          }
        } else {
          if (ownerEntry) {
            owners = ownerEntry.usernames.join(' ');
          }

          console.log(`${padEnd(file, maxLength)}    ${owners}`);
        }
      });
    });
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
