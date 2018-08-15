#!/usr/bin/env node
// @ts-check
'use strict';

const findUp = require('find-up');
const fs = require('fs');
const ignore = require('ignore');
const maxBy = require('lodash.maxby');
const padEnd = require('lodash.padend');
const path = require('path');
const program = require('commander');
const recursive = require('recursive-readdir');

const Codeowners = require('./codeowners.js');

// TODO make a command-line option, and find .git
const rootPath = process.cwd();

const gitignorePath = findUp.sync('.gitignore', { cwd: rootPath });
const gitignoreMatcher = ignore();

if (gitignorePath) {
  gitignoreMatcher.add(fs.readFileSync(gitignorePath).toString());
}

program
  .command('audit')
  .description('list the owners for all files')
  .option('-u, --unowned', 'unowned files only')
  .option('-d, --min-depth <n>', 'roll up unowned files to common paths, but to a minimum depth (only works for unowned)', parseInt)
  .action(options => {
    const codeowners = new Codeowners(rootPath);

    recursive(rootPath, ['.git', 'node_modules'], (err, files) => {
      if (err) {
        console.error(err);

        process.exit(1);
      }

      const relativeFiles = files.map(file => path.relative(codeowners.codeownersDirectory, file));
      const filteredFiles = relativeFiles.filter(gitignoreMatcher.createFilter()).sort();
      const maxLength = maxBy(filteredFiles, file => file.length).length;

      const unownedDirs = new Set();

      filteredFiles.forEach(file => {
        let owners = codeowners.getOwner(file);
        if (options.unowned) {
          if (!owners.length) {

            if (options.minDepth) {
              while (!owners.length && file.split(path.sep).length > options.minDepth) {
                const parentPath = path.dirname(file);
                owners = codeowners.getOwner(parentPath);
                if (!owners.length) {
                  file = parentPath;
                } else {
                  break;
                }
              }
            }

            unownedDirs.add(file);
          }
        } else {
          let owner = 'nobody';
          if (owners.length) {
            owner = owners.join(' ');
          }
          console.log(`${padEnd(file, maxLength)}    ${owners}`);
        }
      });

      if (options.unowned) {
        unownedDirs.forEach(path => console.log(path));
      }
    });
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
