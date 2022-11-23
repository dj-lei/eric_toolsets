'use strict'

import { app, protocol, BrowserWindow, dialog, ipcMain, Menu} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import service from '@/plugins/socket'
const path = require('path')
const fs = require('fs')
const { spawn, exec }  = require("child_process")
const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      webSecurity: false
      // nodeIntegration: false,
      // contextIsolation: true,
      // preload: path.join(__dirname, './preload.js'),
    }
  })

  // child('C:\\Users\\LDJ\\Projects\\ericsson_toolsets\\src\\view.exe', [], {shell:true}, function(err, data) {
  //   if(err){
  //      console.error(err);
  //      return
  //   }
  //   console.log(data.toString())
  // })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  if (!process.env.WEBPACK_DEV_SERVER_URL) {
    // const bat = spawn('C:\\Users\\LDJ\\Projects\\ericsson_toolsets\\src\\view.exe', [], {shell: true, detached: true})
    const bat = spawn(path.join(__dirname).replace("app.asar", "view.exe"), [], {shell: true})
    bat.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    bat.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    bat.on('exit', (code) => {
      console.log(`Child exited with code ${code}`);
    });
  }

  win.on("closed", function(){
    service.emit('shutdown_all', {}, (res) => {
      console.log(res)
    })
    // console.log(bat.pid)
    // exec(`taskkill '/T' '/F' 'PID' ${bat.pid}`)
    // bat.kill( "SIGKILL" )
  })

  let template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Open',
            accelerator: 'CommandOrControl+C',
            click: () => {
              win.webContents.send('open-file')
            }
          },
          { type: 'separator' },
          {
            label: 'Import Theme',
            accelerator: 'CommandOrControl+C',
            click: () => {
              win.webContents.send('import-theme')
            }
          },
          {
            label: 'Save Theme',
            accelerator: 'CommandOrControl+C',
            click: () => {
              win.webContents.send('save-theme')
            }
          },
          {
            label: 'Export Theme',
            accelerator: 'CommandOrControl+C',
            click: () => {
              win.webContents.send('export-theme')
            }
          },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      // { role: 'editMenu' }
      {
        label: 'Edit',
        submenu: [
          {
            label: 'New Search',
            accelerator: 'CommandOrControl+C',
            click: () => {
              win.webContents.send('new-search')
            }
          },
          {
            label: 'Open Function Area',
            accelerator: 'CommandOrControl+C',
            click: () => {
              win.webContents.send('open-func-area')
            }
          },
          { type: 'separator' },
          {
            label: 'Open Global KeyValue Tree',
            accelerator: 'CommandOrControl+C',
            click: () => {
              win.webContents.send('open-global-keyvalue-tree')
            }
          },
          {
            label: 'Open Global Chart',
            accelerator: 'CommandOrControl+C',
            click: () => {
              win.webContents.send('open-global-chart')
            }
          },
        ]
      },
      {
        label: 'Share',
        submenu: [
          {
            label: 'Upload Theme',
            accelerator: 'CommandOrControl+C',
            click: () => {
              win.webContents.send('share-upload')
            }
          },
          {
            label: 'Download Theme',
            accelerator: 'CommandOrControl+C',
            click: () => {
              win.webContents.send('share-download')
            }
          }
        ]
      },
      {
        label: 'EricssonPlug',
        submenu: [
          {
            label: 'DCGM Analysis',
            accelerator: 'CommandOrControl+C',
            click: () => {
              win.webContents.send('test')
            }
          },
          {
            label: 'Work Flow',
            accelerator: 'CommandOrControl+C',
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  let options = {
    // See place holder 1 in above image
    title : "Select Text File", 
    // See place holder 3 in above image
    buttonLabel : "Select",
    // See place holder 4 in above image
    // filters :[
    //   {name: 'Images', extensions: ['jpg', 'png', 'gif']},
    //   {name: 'Movies', extensions: ['mkv', 'avi', 'mp4']},
    //   {name: 'Custom File Type', extensions: ['as']},
    //   {name: 'All Files', extensions: ['*']}
    // ],
    properties: ['openFile']
   }
  
  ipcMain.handle('open-file', async () => {
    const result = await dialog.showOpenDialog(win, options)
    return result
  })

  ipcMain.handle('import-theme', async () => {
    const file = await dialog.showOpenDialog(win, options)
    var content = []
    if (!file.canceled) {
        content = [file.filePaths[0], fs.readFileSync(file.filePaths[0], 'utf-8')]
    }else{
        content = ['', '']
    }
    return content
  })

  ipcMain.handle('export-theme', async (event, config) => {
    const file = await dialog.showSaveDialog(win, {
                    title: 'Select the Path to save config',
                    defaultPath: path.join(__dirname, './assets/config.txt'),
                    buttonLabel: 'Save',
                    // Restricting the user to only Text Files.
                    // filters: [
                    //     {
                    //         name: 'Text Files',
                    //         extensions: ['txt', 'docx']
                    //     }, ],
                    properties: []
                })

    // Stating whether dialog operation was cancelled or not.
    if (!file.canceled) {
        // Creating and Writing to the sample.txt file
        fs.writeFile(file.filePath.toString(), 
            config, function (err) {
            if (err) throw err;
            console.log('Saved!')
        })
    }
    return file
  })

  ipcMain.handle('save-theme', async (event, filepath, config) => {
    fs.writeFile(filepath, 
      config, function (err) {
      if (err) throw err;
          console.log('Saved!')
      })
  })

  ipcMain.handle('downloadURL', (event, payload) => {
    win.webContents.downloadURL(payload.url)
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
