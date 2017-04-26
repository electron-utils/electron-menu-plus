# electron-menu-plus

[![Linux Build Status](https://travis-ci.org/electron-utils/electron-menu-plus.svg?branch=master)](https://travis-ci.org/electron-utils/electron-menu-plus)
[![Windows Build status](https://ci.appveyor.com/api/projects/status/mnlqj3urbd9i6lyx?svg=true)](https://ci.appveyor.com/project/jwu/electron-menu-plus)
[![Dependency Status](https://david-dm.org/electron-utils/electron-menu-plus.svg)](https://david-dm.org/electron-utils/electron-menu-plus)
[![devDependency Status](https://david-dm.org/electron-utils/electron-menu-plus/dev-status.svg)](https://david-dm.org/electron-utils/electron-menu-plus#info=devDependencies)

Improved menu operations for Electron.

## Why?

  - Manipulate menu items by menu path (foo/bar/foobar for example)
  - Dynamically add and remove menu items
  - Dynamically change a menu item's state (enabled, checked, visible, ...)

## Install

```bash
npm install --save electron-menu-plus
```

## Run Examples:

```bash
npm start examples/${name}
```

## Usage

```javascript
const menuPlus = require('electron-menu-plus');

menuPlus.MainMenu.init();
menuPlus.MainMenu.add('My Menu', [
  {
    label: 'Foo',
    click () {
      console.log('Foo');
    }
  },

  {
    label: 'Bar',
    click () {
      console.log('Bar');
    }
  },
]);
```

## API Reference

TODO

## License

MIT © 2017 Johnny Wu
