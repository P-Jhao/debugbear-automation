const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktopEnv', {
  isDesktop: true,
  getDebugBearConfig: () => ipcRenderer.invoke('env:get-debugbear-config'),
  setDebugBearConfig: (payload) => ipcRenderer.invoke('env:set-debugbear-config', payload)
})
