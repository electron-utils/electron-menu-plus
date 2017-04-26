# MainMenu

The main menu module for manipulating main menu items.

## Methods

### MainMenu.apply ()

Apply main menu changes.

### MainMenu.add ( path, template )

  - `path` string - Menu path
  - `template` array|object - Menu template

Build a `template` into menu item and add it to `path`

### MainMenu.init ()

Init main menu.

### MainMenu.remove ( path )

  - `path` string - Menu path

Remove menu item at `path`.

### MainMenu.set ( path, options )

  - `path` string - Menu path
  - `options` object
    - `icon` NativeImage - A [NativeImage](http://electron.atom.io/docs/api/native-image/)
    - `enabled` boolean
    - `visible` boolean
    - `checked` boolean - NOTE: You must set your menu-item type to 'checkbox' to make it work

Set options of a menu item at `path`.

### MainMenu.update ( path, template )

  - `path` string - Menu path
  - `template` array|object - Menu template

Build a `template` into menu item and update it to `path`

## Properties

### MainMenu.menu

Get main menu instance for debug purpose

## IPC Messages

### Message: 'menu-plus:main-menu-add'

### Message: 'menu-plus:main-menu-apply'

### Message: 'menu-plus:main-menu-remove'

### Message: 'menu-plus:main-menu-set'

### Message: 'menu-plus:main-menu-update'
