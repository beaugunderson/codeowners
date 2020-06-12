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

const Codeowners = require('./codeowners.js');

// https://stackoverflow.com/a/5827895
function walk(dir, excludedFiles, done) {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    list = list.filter(file => !excludedFiles.includes(file));
    let pending = list.length;
    if (!pending) return done(null, results);

    list.forEach(file => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, excludedFiles, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

// TODO make a command-line option, and find .git
const rootPath = process.cwd();

const gitignoreMatcher = ignore();
const gitignorePath = findUp.sync('.gitignore', { cwd: rootPath });
if (gitignorePath) {
  gitignoreMatcher.add(fs.readFileSync(gitignorePath).toString());
}

program
  .command('audit')
  .description('list the owners for all files')
  .option('-u, --unowned', 'unowned files only')
  .action(options => {
    const codeowners = new Codeowners(rootPath);

    walk(
      rootPath,
      ['.git', 'node_modules', '@types', '.github', 'flow-typed', '.vscode'],
      (err, files) => {
        if (err) {
          console.error(err);

          process.exit(1);
        }

        files.sort();

        const relativeFiles = files.map(file =>
          path.relative(codeowners.codeownersDirectory, file)
        );

        const gitignorePath = findUp.sync('.gitignore', { cwd: rootPath });
        if (gitignorePath) {
          gitignoreMatcher.add(fs.readFileSync(gitignorePath).toString());
        }
        const filteredFiles = relativeFiles
          .filter(gitignoreMatcher.createFilter())
          .sort();
        const maxLength = maxBy(filteredFiles, file => file.length).length;

        const uniqueEntries = new Map();

        filteredFiles.forEach(file => {
          let owners = codeowners.getOwner(file);
          if (options.unowned) {
            if (!owners.length) {
              const rootFoldersWithFilesWeCareAbout = [
                'end-to-end',
                'web/frontend',
                'web/backend',
                'web',
                'web-ssr',
                '', // root folder
              ];

              const nestedFoldersWeDontCareAbout = [
                '__generated__',
                '__snapshots__',
                '.venv',
                'web/static/images',
                'web/frontend/assets/images',
              ];

              const dirname = path.dirname(file);

              if (
                nestedFoldersWeDontCareAbout.some(folder =>
                  dirname.includes(folder)
                )
              ) {
                return;
              }

              if (
                rootFoldersWithFilesWeCareAbout.some(
                  folder => path.dirname(file) === folder
                )
              ) {
                uniqueEntries.set(file, file);
                return;
              }

              uniqueEntries.set(path.dirname(file), file);
              return;
            }
          } else {
            let printedOwner = 'nobody';
            if (owners.length) {
              printedOwner = owners.join(' ');
            }
            console.log(`${padEnd(file, maxLength)}    ${printedOwner}`);
          }
        });

        Array.from(uniqueEntries.keys()).forEach(e => console.log(e));
      }
    );
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
