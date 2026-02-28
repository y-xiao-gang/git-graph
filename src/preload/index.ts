import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openRepo: () => ipcRenderer.invoke('git:open-repo'),
  getStatus: () => ipcRenderer.invoke('git:status'),
  getLog: (maxCount?: number) => ipcRenderer.invoke('git:log', maxCount),
  getBranches: () => ipcRenderer.invoke('git:branches'),
  checkout: (branchName: string) => ipcRenderer.invoke('git:checkout', branchName),
  pull: () => ipcRenderer.invoke('git:pull'),
  push: () => ipcRenderer.invoke('git:push'),
  merge: (fromBranch: string) => ipcRenderer.invoke('git:merge', fromBranch),
  add: (files: string | string[]) => ipcRenderer.invoke('git:add', files),
  commit: (message: string) => ipcRenderer.invoke('git:commit', message),
  show: (hash: string) => ipcRenderer.invoke('git:show', hash),
  diff: (options?: string[]) => ipcRenderer.invoke('git:diff', options),
  getFileDiff: (hash: string, file: string) => ipcRenderer.invoke('git:getFileDiff', hash, file)
})
