'use strict';

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const colors = require('colors');

class Repository {
  constructor(dir) {
    this.dir = dir;
    this.configFile = path.resolve(this.dir, '.git/config');
    this.packageFile = path.resolve(this.dir, 'package.json');
  }

  getOrigin() {
    let source = fs.readFileSync(this.configFile, 'utf-8');
    return (
      (
        source
          .split('\n')
          .filter(line => line.trim().startsWith('url = git@'))[0] || ''
      ).split('url =')[1] || ''
    ).trim();
  }

  async getStats() {
    let status = await this.getStatus(),
      deleted = [],
      modified = [],
      created = [],
      branch = null,
      createdSection = false,
      addedSection = false,
      added = {
        modified: [],
        created: [],
        deleted: [],
      };
    status
      .split('\n')
      .map(line => line.trim())
      .forEach(line => {
        if (
          line ===
          '(use "git add <file>..." to include in what will be committed)'
        ) {
          createdSection = true;
          return;
        }
        if (createdSection && !line) {
          createdSection = false;
        }
        if (createdSection) {
          created.push(line);
        }
        if (line === '(use "git restore --staged <file>..." to unstage)') {
          addedSection = true;
          return;
        }
        if (addedSection && !line) {
          addedSection = false;
        }
        if (addedSection) {
          let type = line.slice(0, line.indexOf(':')).trim();
          if (type === 'new file') type = 'created';
          let filename = line.slice(type.length + 1).trim();
          added[type] = added[type] || [];
          added[type].push(filename);
        }
        if (line.startsWith('On branch')) {
          branch = line.split('On branch')[1].trim();
          return;
        }
        if (line.startsWith('deleted:')) {
          deleted.push((line.split('deleted:')[1] || '').trim());
          return;
        }
        if (line.startsWith('modified:')) {
          modified.push((line.split('modified:')[1] || '').trim());
          return;
        }
      });
    return {
      branch,
      deleted,
      modified,
      created,
      added,
    };
  }

  getStatus() {
    return new Promise((resolve, reject) => {
      childProcess.exec(
        `git status`,
        {
          cwd: this.dir,
        },
        (error, stdout, stderr) => {
          if (error) return reject(error + '');
          resolve(stdout + '');
        }
      );
    });
  }

  changeOriginHost(from, to) {
    let source = fs.readFileSync(this.configFile, 'utf-8'),
      origin = source
        .split('\n')
        .filter(line => line.trim().startsWith('url = git@'))[0];
    if (!origin) return;
    if (from !== 'any' && !origin.includes(`git@${from}:`)) return;
    let newOrigin = origin.replace(`git@${from}:`, `git@${to}:`),
      newSource = source.replace(origin, newOrigin);
    fs.writeFileSync(this.configFile, newSource);
    console.log(
      `Project «${this.dir}» origin host changed from «${from}» to «${to}».`
    );
  }

  updateVersion() {
    if (!fs.existsSync(this.packageFile)) return 'new';
    let pack = JSON.parse(fs.readFileSync(this.packageFile, 'utf-8')),
      ver = pack.version.split('.').map(n => +n),
      newVer = [ver[0], ver[1], ver[2] + 1];
    pack.version = newVer.join('.');
    fs.writeFileSync(this.packageFile, JSON.stringify(pack, null, 2));
    return pack.version;
  }

  push() {
    let version = this.updateVersion(),
      message = `Version ${version}`;
    console.log(`Updating version ${version}...`.cyan);
    childProcess.spawnSync('git', ['add', '.', '--all'], {
      cwd: this.dir,
      stdio: 'inherit',
    });
    console.log(`\nCommit message: «${message}».`.cyan);
    childProcess.spawnSync('git', ['commit', '-m', message], {
      cwd: this.dir,
      stdio: 'inherit',
    });
    console.log(`\nPushing...`.cyan);
    childProcess.spawnSync('git', ['push', '-u', 'origin', 'master'], {
      cwd: this.dir,
      stdio: 'inherit',
    });
    this.publish();
  }

  publish() {
    if (!fs.existsSync(this.packageFile)) return 'new';
    let pack = JSON.parse(fs.readFileSync(this.packageFile, 'utf-8'));
    if (!pack.publish) return;
    console.log(`\nPublishing...`.cyan);
    childProcess.spawnSync('npm', ['publish', '.'], {
      cwd: this.dir,
      stdio: 'inherit',
    });
    if (!pack.upgrade) return;
    console.log(`\nRemoving...`.cyan);
    childProcess.spawnSync('sudo', ['yarn', 'global', 'remove', pack.name], {
      cwd: this.dir,
      stdio: 'inherit',
    });
    console.log(`\nInstalling...`.cyan);
    childProcess.spawnSync('sudo', ['yarn', 'global', 'add', pack.name], {
      cwd: this.dir,
      stdio: 'inherit',
    });
  }
}

module.exports = Repository;
