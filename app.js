'use strict';

const gitools = require('./lib');
const path = require('path');

let repo = new gitools.Repository(process.cwd());

repo.push();
