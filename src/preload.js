const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs')

contextBridge.exposeInMainWorld('openFile', {
    open: () => ipcRenderer.invoke('open-file:open')
})

contextBridge.exposeInMainWorld('openConfig', {
    open: () => ipcRenderer.invoke('open-config:open').then((result) => {
                    if (!result.canceled) {
                        return [result.filePaths[0], fs.readFileSync(result.filePaths[0], 'utf-8')]
                    }else{
                        return ['', '']
                    }
                })
})

contextBridge.exposeInMainWorld('saveConfig', {
    save: (config) => ipcRenderer.invoke('save-config:saveAs', config),
    saveAuto: (filepath, config) => ipcRenderer.invoke('save-config:saveAuto', filepath, config)
})