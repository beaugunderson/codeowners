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
const { walkStream } = require('@nodelib/fs.walk');

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
    let codeowners;

    try {
      codeowners = new Codeowners(rootPath, options.codeownersFilename);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }

    const padding = parseInt(options.width, 10);

    const stream = walkStream(rootPath, {
      deepFilter: (entry) => {
        const split = entry.path.split(path.sep);
        return !split.includes('node_modules') && !split.includes('.git');
      },
      errorFilter: (error) =>
        error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EPERM',
    });

    stream.on('data', (file) => {
      const relative = path
        .relative(codeowners.codeownersDirectory, file.path)
        .replace(/(\r)/g, '\\r');

      const owners = codeowners.getOwner(relative);

      if (options.unowned) {
        if (!owners.length) {
          console.log(relative);
        }
      } else {
        console.log(
          `${padEnd(relative, padding)}    ${owners.length ? owners.join(' ') : 'nobody'}`
        );
      }
    });

    stream.on('error', (err) => {
      console.error(err);
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
    let codeowners;

    // instantiate new Codeowners obj
    try {
      codeowners = new Codeowners(rootPath, options.codeownersFilename);
    } catch (e) {
      console.error(e.message);
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
