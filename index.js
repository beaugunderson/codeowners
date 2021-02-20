#!/usr/bin/env node

/* eslint-disable no-console */
// @ts-check

const findUp = require('find-up');
const fs = require('fs');
const ignore = require('ignore');
const intersection = require('lodash.intersection');
const padEnd = require('lodash.padend');
const path = require('path');
const program = require('commander');
const walk = require('walk');

const Codeowners = require('./codeowners.js');

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
  .option('-w, --width <columns>', 'how much should filenames be padded?', '32')
  .option(
    '-c, --codeowners-filename <codeowners_filename>',
    'specify CODEOWNERS filename',
    'CODEOWNERS'
  )
  .action((options) => {
    const codeowners = new Codeowners(rootPath, options.codeownersFilename);
    const padding = parseInt(options.width, 10);

    const walker = walk.walk(rootPath, { filters: ['.git', 'node_modules'] });

    // walker.on("names", (root, nodeNamesArray) => {
    //   nodeNamesArray.sort((a, b) => {
    //     if (a > b) return 1;
    //     if (a < b) return -1;
    //     return 0;
    //   });
    // });

    // walker.on("directories", (root, dirStatsArray, next) => {
    //   next();
    // });

    // walker.on("directories", (root, dirStatsArray, next) => {
    //   console.log({ dirStatsArray })

    //   const sorted = dirStatsArray
    //     .filter(stats => stats.isFile())
    //     .sort((a, b) => a < b ? -1 : 1);

    //   // const relativeFiles = files.map((file) => path.relative(codeowners.codeownersDirectory, file));
    //   // const filteredFiles = relativeFiles.filter(gitignoreMatcher.createFilter()).sort();
    //   // const maxLength = maxBy(filteredFiles, (file) => file.length).length;

    //   sorted.forEach((file) => {
    //   });

    //   next();

    //   // for (const stats of dirStatsArray) {
    //   //   if (!stats.isFile()) {
    //   //     continue;
    //   //   }
    //   // }

    //   // next();
    // });

    walker.on('file', (root, fileStats, next) => {
      const rooted = path.join(root, fileStats.name);
      const relative = path.relative(codeowners.codeownersDirectory, rooted);
      const owners = codeowners.getOwner(relative);

      if (options.unowned) {
        if (!owners.length) {
          console.log(relative);
        }
      } else {
        let printedOwner = 'nobody';

        if (owners.length) {
          printedOwner = owners.join(' ');
        }

        console.log(`${padEnd(relative, padding)}    ${printedOwner}`);
      }

      next();
    });

    walker.on('errors', (root, nodeStatsArray, next) => {
      for (const stats of nodeStatsArray) {
        if (stats.error) {
          console.error(`Error: ${stats.error}`);
        }
      }

      next();
    });
  });

program
  .command('verify <path> <users...>')
  .description('verify users/teams own a specific path')
  .option(
    '-c, --codeowners-filename <codeowners_filename>',
    'specify CODEOWNERS filename',
    'CODEOWNERS'
  )
  .action((checkPath, users, options) => {
    // instantiate new Codeowners obj
    const codeowners = new Codeowners(rootPath, options.codeownersFilename);

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
