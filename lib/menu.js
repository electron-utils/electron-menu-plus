'use strict';

const { Menu, MenuItem, BrowserWindow } = require('electron');
const ipcPlus = require('electron-ipc-plus');
const path_ = require('path');
const pathPlus = require('path-plus');
const _ = require('lodash');

let _showDev = false;

/**
 * @class MenuP
 */
class MenuP {
  /**
   * @constructor
   * @param {object[]|object|Electron.Menu} template - Menu template for initialize. The template take the options of
   * Electron's [Menu Item](http://electron.atom.io/docs/api/menu-item/)
   * @param {string} template.path - add a menu item by path.
   * @param {string} template.message - Ipc message name.
   * @param {string} template.command - A global function in main process (e.g. Editor.log ).
   * @param {array} template.params - The parameters passed through ipc.
   * @param {string} template.panel - The panelID, if specified, the message will send to panel.
   * @param {string} template.dev - Only show when MenuP.showDev is true.
   * @param {object} [webContents] - A [WebContents](http://electron.atom.io/docs/api/web-contents/) object.
   * @return {MenuP}
   */
  constructor(template, webContents) {
    if (template instanceof Menu) {
      this.electronMenu = template;
      return;
    }

    if (!template) {
      this.electronMenu = new Menu();
      return;
    }

    MenuP.convert(template, webContents);
    this.electronMenu = Menu.buildFromTemplate(template);
  }

  /**
   * @method dispose
   *
   * De-reference the native menu.
   */
  dispose() {
    this.electronMenu = null;
  }

  /**
   * @method reset
   * @param {object[]|object} template
   *
   * Reset the menu from the template.
   */
  reset(template) {
    MenuP.convert(template);
    this.electronMenu = Menu.buildFromTemplate(template);
  }

  /**
   * @method clear
   *
   * Clear all menu item in it.
   */
  clear() {
    this.electronMenu = new Menu();
  }

  /**
   * @method add
   * @param {string} path - A menu path
   * @param {object[]|object} template
   *
   * Build a template into menu item and add it to path
   *
   * @example
   * ```js
   * const {Menu} = require('electron-menu-plus');
   *
   * let editorMenu = new Menu();
   * editorMenu.add( 'foo/bar', {
   *   label: foobar,
   *   message: 'foobar:say',
   *   params: ['foobar: hello!']
   * });
   *
   * // you can also create menu without label
   * // it will add menu to foo/bar where bar is the menu-item
   * let editorMenu = new Menu();
   * editorMenu.add( 'foo/bar/foobar', {
   *   message: 'foobar:say',
   *   params: ['foobar: hello!']
   * });
   * ```
   */
  add(path, template) {
    // in object mode, we should set label from path if not exists
    if (!Array.isArray(template)) {
      if (!template.label && template.type !== 'separator') {
        let start = path.lastIndexOf('/');
        if (start !== -1) {
          template.label = path.slice(start + 1);
          path = path.slice(0, start);
        }
      }
    }

    let menuItem = _getMenuItem(this.electronMenu, path, true);

    if (!menuItem) {
      console.error(`Failed to find menu in path: ${path}`);
      return false;
    }

    if (menuItem.type !== 'submenu' || !menuItem.submenu) {
      console.error(`Failed to add menu at ${path}, it is not a submenu`);
      return false;
    }

    if (!Array.isArray(template)) {
      template = [template];
    }

    MenuP.convert(template);
    let newSubMenu = Menu.buildFromTemplate(template);

    for (let i = 0; i < newSubMenu.items.length; ++i) {
      let newSubMenuItem = newSubMenu.items[i];

      let exists = menuItem.submenu.items.some(item => {
        return item.label === newSubMenuItem.label;
      });

      if (exists) {
        console.error(
          `Failed to add menu to ${path},
          a menu item ${path_.posix.join(path, newSubMenuItem.label)} you tried to add already exists`
        );
        return false;
      }
    }

    for (let i = 0; i < newSubMenu.items.length; ++i) {
      let newSubMenuItem = newSubMenu.items[i];
      menuItem.submenu.append(newSubMenuItem);
    }

    return true;
  }

  /**
   * @method insert
   * @param {string} path - A menu path
   * @param {number} pos
   * @param {object[]|object} template
   *
   * Build a template into menu item and insert it to path at specific position
   */
  insert(path, pos, template) {
    // in object mode, we should set label from path if not exists
    if (!Array.isArray(template)) {
      if (!template.label && template.type !== 'separator') {
        let start = path.lastIndexOf('/');
        if (start !== -1) {
          template.label = path.slice(start + 1);
          path = path.slice(0, start);
        }
      }
    }

    // insert at root
    let parentPath = path_.dirname(path);
    if (parentPath === '.') {
      if (!Array.isArray(template)) {
        template = [template];
      }

      MenuP.convert(template);
      let newSubMenu = Menu.buildFromTemplate(template);

      let newMenuItem = new MenuItem({
        label: path,
        id: path.toLowerCase(),
        submenu: new Menu(),
        type: 'submenu',
      });
      for (let i = 0; i < newSubMenu.items.length; ++i) {
        let newSubMenuItem = newSubMenu.items[i];
        newMenuItem.submenu.append(newSubMenuItem);
      }

      this.electronMenu.insert(pos, newMenuItem);

      return true;
    }

    // insert at path
    let name = path_.basename(path);
    let menuItem = _getMenuItem(this.electronMenu, parentPath);

    if (!menuItem) {
      console.error(`Failed to find menu in path: ${parentPath}`);
      return false;
    }

    if (menuItem.type !== 'submenu' || !menuItem.submenu) {
      console.error(`Failed to insert menu at ${parentPath}, it is not a submenu`);
      return false;
    }

    let exists = menuItem.submenu.items.some(item => {
      return item.label === name;
    });

    if (exists) {
      console.error(
        `Failed to insert menu to ${path}, already exists`
      );
      return false;
    }

    if (!Array.isArray(template)) {
      template = [template];
    }

    MenuP.convert(template);
    let newSubMenu = Menu.buildFromTemplate(template);

    let newMenuItem = new MenuItem({
      label: name,
      id: name.toLowerCase(),
      submenu: new Menu(),
      type: 'submenu',
    });
    for (let i = 0; i < newSubMenu.items.length; ++i) {
      let newSubMenuItem = newSubMenu.items[i];
      newMenuItem.submenu.append(newSubMenuItem);
    }

    menuItem.submenu.insert(pos, newMenuItem);

    return true;
  }

  /**
   * @method remove
   * @param {string} path - A menu path
   *
   * Remove menu item at path.
   */
  // base on electron#527 said, there is no simple way to remove menu item
  // https://github.com/atom/electron/issues/527
  remove(path) {
    let newMenu = new Menu();
    let removed = _cloneMenuExcept(newMenu, this.electronMenu, path, '');

    if (!removed) {
      console.error(`Failed to remove menu in path: ${path} (could not be found)`);
      return false;
    }

    this.electronMenu = newMenu;
    return true;
  }

  /**
   * @param {string} path - A menu path
   * @param {object[]|object} template
   *
   * Update menu item at path.
   */
  update(path, template) {
    let index = _getMenuItemIndex(this.electronMenu, path);
    this.remove(path);
    return this.insert(path, index, template);
  }

  /**
   * @method set
   * @param {string} path - A menu path
   * @param {object} [options]
   * @param {NativeImage} [options.icon] - A [NativeImage](http://electron.atom.io/docs/api/native-image/)
   * @param {boolean} [options.enabled]
   * @param {boolean} [options.visible]
   * @param {boolean} [options.checked] - NOTE: You must set your menu-item type to 'checkbox' to make it work
   *
   * Set menu options at path.
   */
  set(path, options) {
    let menuItem = _getMenuItem(this.electronMenu, path, false);

    if (!menuItem) {
      // console.error(`Failed to set menu in path ${path}: menu item not found`);
      return false;
    }

    if (menuItem.type === 'separator') {
      console.error(`Failed to set menu in path ${path}: menu item is a separator`);
      return false;
    }

    if (options.icon !== undefined) {
      menuItem.icon = options.icon;
    }

    if (options.enabled !== undefined) {
      menuItem.enabled = options.enabled;
    }

    if (options.visible !== undefined) {
      menuItem.visible = options.visible;
    }

    if (options.checked !== undefined) {
      menuItem.checked = options.checked;
    }

    return true;
  }

  static set showDev(value) { _showDev = value; }
  static get showDev() { return _showDev; }

  /**
   * @method convert
   * @param {object[]|object} template
   * @param {object} [webContents] - A [WebContents](http://electron.atom.io/docs/api/web-contents/) object.
   *
   * Convert the menu template to process additional keyword we added for Electron.
   * If webContents provided, the `template.message` will send to the target webContents.
   */
  static convert(template, webContents) {
    if (!Array.isArray(template)) {
      console.error('template must be an array');
      return;
    }

    for (let i = 0; i < template.length; ++i) {
      let remove = _convert(template, i, webContents);
      if (remove) {
        template.splice(i, 1);
        --i;
      }
    }
  }

  /**
   * @method walk
   * @static
   * @param {object[]|object} template
   * @param {function} fn
   */
  static walk(template, fn) {
    if (!Array.isArray(template)) {
      template = [template];
    }

    template.forEach(item => {
      fn(item);
      if (item.submenu) {
        MenuP.walk(item.submenu, fn);
      }
    });
  }
}

module.exports = MenuP;

// ========================================
// Ipc
// ========================================

ipcPlus.on('menu-plus:popup', (event, template, x, y) => {
  // DISABLE: it is possible we sending the ipc from a window
  //          that don't register in Window
  // let win = Window.find(event.sender);
  // let win.popupMenu(template,x,y);

  if (x !== undefined) {
    x = Math.floor(x);
  }

  if (y !== undefined) {
    y = Math.floor(y);
  }

  let menuP = new MenuP(template, event.sender);
  menuP.electronMenu.popup(BrowserWindow.fromWebContents(event.sender), x, y);
  menuP.dispose();
});

// ========================================
// Internal
// ========================================

function _expandMenuTemplate(tmpl, index) {
  //
  let itemTmpl = tmpl[index];
  if (!itemTmpl.path) {
    return;
  }

  //
  let pathNames = itemTmpl.path.split('/');
  if (pathNames.length === 1) {
    tmpl[index].label = pathNames[0];
    return false;
  }

  //
  let submenu = tmpl;
  let parentTmpl = null;
  let curPath = '';
  let removeOriginal = false;

  for (let i = 0; i < pathNames.length - 1; i++) {
    let isLastOne = i === pathNames.length - 2;
    let name = pathNames[i];

    curPath = path_.posix.join(curPath, name);

    // find menu item
    parentTmpl = null;
    let idx = _.findIndex(submenu, item => {
      return item.label === name;
    });
    if (idx !== -1) {
      parentTmpl = submenu[idx];
    }

    // create menu template if not found
    if (!parentTmpl) {
      parentTmpl = {
        label: name,
        type: 'submenu',
        submenu: [],
      };

      // if this is first path, we just replace the old template
      if (i === 0) {
        submenu[index] = parentTmpl;
      } else {
        submenu.push(parentTmpl);
      }
    } else {
      if (i === 0) {
        removeOriginal = true;
      }
    }

    if (!parentTmpl.submenu || parentTmpl.type !== 'submenu') {
      console.warn(`Cannot add menu in ${itemTmpl.path}, the ${curPath} is already used`);
      return;
    }

    if (isLastOne) {
      break;
    }

    submenu = parentTmpl.submenu;
  }

  //
  itemTmpl.label = pathNames[pathNames.length - 1];
  parentTmpl.submenu.push(itemTmpl);

  return removeOriginal;
}

function _getMenuItemIndex(electronMenu, path) {
  let nextMenu = electronMenu;
  let pathNames = path.split('/');
  let curPath = '';

  for (let i = 0; i < pathNames.length; i++) {
    let isLastOne = i === pathNames.length - 1;
    let name = pathNames[i];
    let menuItem = null;

    curPath = path_.posix.join(curPath, name);

    // find menu item
    let index = _.findIndex(nextMenu.items, item => {
      return item.label === name;
    });
    if (index !== -1) {
      menuItem = nextMenu.items[index];
    }

    //
    if (menuItem) {
      if (isLastOne) {
        return index;
      }

      if (!menuItem.submenu || menuItem.type !== 'submenu') {
        return -1;
      }

      nextMenu = menuItem.submenu;
      continue;
    }

    //
    return -1;
  }

  return -1;
}

function _getMenuItem(electronMenu, path, createIfNotExists) {
  let nextMenu = electronMenu;
  if (typeof createIfNotExists !== 'boolean') {
    createIfNotExists = false;
  }

  let pathNames = path.split('/');
  let curPath = '';

  for (let i = 0; i < pathNames.length; i++) {
    let isLastOne = i === pathNames.length - 1;
    let name = pathNames[i];
    let menuItem = null;

    curPath = path_.posix.join(curPath, name);

    // find menu item
    let index = _.findIndex(nextMenu.items, item => {
      return item.label === name;
    });
    if (index !== -1) {
      menuItem = nextMenu.items[index];
    }

    //
    if (menuItem) {
      if (isLastOne) {
        return menuItem;
      }

      if (!menuItem.submenu || menuItem.type !== 'submenu') {
        console.warn(`Cannot add menu in ${path}, the ${curPath} is already used`);
        return null;
      }

      nextMenu = menuItem.submenu;
      continue;
    }

    //
    if (createIfNotExists) {
      menuItem = new MenuItem({
        label: name,
        id: name.toLowerCase(),
        submenu: new Menu(),
        type: 'submenu',
      });

      // if this is the first one
      if (i === 0) {
        // HACK: we assume last menuItem always be 'Help'
        // let pos = Math.max( nextMenu.items.length, 0 );
        let pos = Math.max(nextMenu.items.length - 1, 0);
        nextMenu.insert(pos, menuItem);
      } else {
        nextMenu.append(menuItem);
      }

      if (isLastOne) {
        return menuItem;
      }

      nextMenu = menuItem.submenu;
      continue;
    }

    //
    return null;
  }

  return null;
}

function _cloneMenuItemLevel1(menuItem) {
  let options = _.pick(menuItem, [
    'click',
    'role',
    'type',
    'label',
    'sublabel',
    'accelerator',
    'icon',
    'enabled',
    'visible',
    'checked',
    // 'submenu', // NOTE: never clone submenu, other wise we can't change item inside it
    'id',
    'position',
  ]);

  if (options.type === 'submenu') {
    options.submenu = new Menu();
  }

  return new MenuItem(options);
}

function _cloneMenuExcept(newMenu, electronMenu, exceptPath, curPath) {
  let found = false;

  for (let i = 0; i < electronMenu.items.length; ++i) {
    let menuItem = electronMenu.items[i];
    let path = path_.posix.join(curPath, menuItem.label);

    if (!pathPlus.contains(path, exceptPath)) {
      newMenu.append(menuItem);
      continue;
    }

    if (path === exceptPath) {
      found = true;
      continue;
    }

    let newMenuItem = _cloneMenuItemLevel1(menuItem);
    if (newMenuItem.type !== 'submenu') {
      newMenu.append(newMenuItem);
      continue;
    }

    let result = _cloneMenuExcept(
      newMenuItem.submenu,
      menuItem.submenu,
      exceptPath,
      path
    );

    if (result) {
      found = true;
    }

    if (newMenuItem.submenu.items.length > 0) {
      newMenu.append(newMenuItem);
    }
  }

  return found;
}

function _convert(submenuTmpl, index, webContents) {
  let template = submenuTmpl[index];
  let itemName = template.path || template.label;

  // remove the template if it is dev and we are not in dev mode
  if (template.dev && _showDev === false) {
    return true;
  }

  // parse message
  if (template.message) {
    // make sure message and click not used together
    if (template.click) {
      console.error(
        `Skip 'click' in menu item '${itemName}', already has 'message'`
      );
    }

    // make sure message and command not used together
    if (template.command) {
      console.error(
        `Skip 'command' in menu item '${itemName}', already has 'message'`
      );
    }

    let args = [template.message];

    // parse params
    if (template.params) {
      if (!Array.isArray(template.params)) {
        console.error(
          `Failed to add menu item '${itemName}', 'params' must be an array`
        );
        // return true to remote the menu item
        return true;
      }
      args = args.concat(template.params);
    }

    // parse panel
    if (template.panel) {
      args.unshift(template.panel);
    }

    // parse click
    // NOTE: response in next tick to prevent ipc blocking issue caused by atom-shell's menu.
    if (template.panel) {
      template.click = () => {
        setImmediate(() => {
          ipcPlus.sendToPanel.apply(null, args);
        });
      };
    } else if (webContents) {
      template.click = () => {
        setImmediate(() => {
          webContents.send.apply(webContents, args);
        });
      };
    } else {
      template.click = () => {
        setImmediate(() => {
          ipcPlus.sendToMain.apply(null, args);
        });
      };
    }

  }
  // parse command
  else if (template.command) {
    // make sure command and click not used together
    if (template.click) {
      console.error(
        `Skipping "click" action in menu item '${itemName}' since it's already mapped to a command.`
      );
    }

    // get global function
    let fn = _.get(global, template.command, null);

    if (!fn || typeof fn !== 'function') {
      console.error(
        `Failed to add menu item '${itemName}', cannot find global function ${template.command} in main process for 'command'.`
      );
      // return true to remote the menu item
      return true;
    }

    let args = [];

    if (template.params) {
      if (!Array.isArray(template.params)) {
        console.error('message parameters must be an array');
        return;
      }
      args = args.concat(template.params);
    }

    template.click = () => {
      fn.apply(null, args);
    };
  }
  // parse submenu
  else if (template.submenu) {
    MenuP.convert(template.submenu, webContents);
  }

  let removeOriginal = false;

  // check label
  if (template.path) {
    // make sure path and label not used together
    if (template.label) {
      console.warn(`Skipping label "${template.label}" in menu item "${template.path}"`);
    }

    removeOriginal = _expandMenuTemplate(submenuTmpl, index);
  } else {
    if (template.label === undefined && template.type !== 'separator') {
      console.warn('Missing label for menu item');
    }
  }

  return removeOriginal;
}
