'use strict';

/**
 * @module Editor.MainMenu
 *
 * The main menu module for manipulating main menu items
 */
let MainMenu = {};
module.exports = MainMenu;

// requires
const { Menu } = require('electron');
const ipcPlus = require('electron-ipc-plus');
const MenuP = require('./menu');

let _mainMenu;

// ========================================
// exports
// ========================================

/**
 * @method init
 *
 * Init main menu
 */
MainMenu.init = function () {
  if (!_mainMenu) {
    _mainMenu = new MenuP(Menu.getApplicationMenu());
  }

  MainMenu.apply();
};

/**
 * @method apply
 *
 * Apply main menu changes
 */
MainMenu.apply = function () {
  Menu.setApplicationMenu(_mainMenu.electronMenu);
};

/**
 * @method add
 * @param {string} path - A menu path
 * @param {object[]|object} - template
 *
 * Build a template into menu item and add it to path
 */
MainMenu.add = function (path, template) {
  if (_mainMenu.add(path, template)) {
    MainMenu.apply();
  }
};

/**
 * @method update
 * @param {string} path - A menu path
 * @param {object[]|object} - template
 *
 * Build a template into menu item and update it at path
 */
MainMenu.update = function (path, template) {
  if (_mainMenu.update(path, template)) {
    MainMenu.apply();
  }
};

/**
 * @method remove
 * @param {string} path - A menu path
 *
 * Remove menu item at path.
 */
MainMenu.remove = function (path) {
  if (_mainMenu.remove(path)) {
    MainMenu.apply();
  }
};

/**
 * @method set
 * @param {string} path - A menu path
 * @param {object} [options]
 * @param {NativeImage} [options.icon] - A [NativeImage](https://github.com/atom/electron/blob/master/docs/api/native-image.md)
 * @param {boolean} [options.enabled]
 * @param {boolean} [options.visible]
 * @param {boolean} [options.checked] - NOTE: You must set your menu-item type to 'checkbox' to make it work
 *
 * Set options of a menu item at path.
 */
MainMenu.set = function (path, options) {
  if (_mainMenu.set(path, options)) {
    MainMenu.apply();
  }
};

/**
 * @property menu
 *
 * Get main menu instance for debug purpose
 */
Object.defineProperty(MainMenu, 'menu', {
  enumerable: true,
  get() { return _mainMenu; },
});

// ========================================
// Ipc
// ========================================

ipcPlus.on('menu-plus:main-menu-add', (event, path, template) => {
  MainMenu.add(path, template);
});

ipcPlus.on('menu-plus:main-menu-remove', (event, path) => {
  MainMenu.remove(path);
});

ipcPlus.on('menu-plus:main-menu-set', (event, path, options) => {
  MainMenu.set(path, options);
});

ipcPlus.on('menu-plus:main-menu-update', (event, path, template) => {
  MainMenu.update(path, template);
});

ipcPlus.on('menu-plus:main-menu-apply', () => {
  MainMenu.apply();
});
