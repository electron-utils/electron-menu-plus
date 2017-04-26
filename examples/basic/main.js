'use strict';

const {app, BrowserWindow} = require('electron');
const {MainMenu} = require('../../index');

let win;

app.on('ready', function () {
  win = new BrowserWindow({
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  });
  win.loadURL('file://' + __dirname + '/index.html');

  MainMenu.init();
  MainMenu.add('My Menu', [
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
});