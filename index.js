'use strict';

const platform = require('electron-platform');

let exps;

if ( platform.isMainProcess ) {
  exps = require('./lib/index');
} else {
  exps = require('./lib/renderer');
}

// ==========================
// exports
// ==========================

module.exports = exps;