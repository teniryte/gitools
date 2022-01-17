'use strict';

const _ = require('ooi');
const path = require('path');
const fs = require('fs');

const exclude = ['node_modules', '.cache', '.local', '.config'];

function findRepos(...dirs) {
  let projects = [];
  dirs.forEach(dir => {
    projects = [
      ...projects,
      ...findGitDirs(dir).map(dir => path.resolve(dir, '..')),
    ];
  });
  return projects;
}

function findGitDirs(dir) {
  let gitDirs = [],
    files = fs.readdirSync(dir).map(name => path.resolve(dir, name));
  files.forEach(filename => {
    if (
      !fs.existsSync(filename) ||
      !fs.statSync(filename).isDirectory() ||
      exclude.includes(path.basename(filename)) ||
      fs.realpathSync(filename) !== filename
    )
      return;
    if (path.basename(filename) === '.git') {
      return gitDirs.push(filename);
    }
    gitDirs = [...gitDirs, ...findGitDirs(filename)];
  });
  return gitDirs;
}

module.exports = findRepos;
