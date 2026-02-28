"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  openRepo: () => electron.ipcRenderer.invoke("git:open-repo"),
  getStatus: () => electron.ipcRenderer.invoke("git:status"),
  getLog: (maxCount) => electron.ipcRenderer.invoke("git:log", maxCount),
  getBranches: () => electron.ipcRenderer.invoke("git:branches"),
  checkout: (branchName) => electron.ipcRenderer.invoke("git:checkout", branchName),
  pull: () => electron.ipcRenderer.invoke("git:pull"),
  push: () => electron.ipcRenderer.invoke("git:push"),
  merge: (fromBranch) => electron.ipcRenderer.invoke("git:merge", fromBranch),
  add: (files) => electron.ipcRenderer.invoke("git:add", files),
  commit: (message) => electron.ipcRenderer.invoke("git:commit", message),
  show: (hash) => electron.ipcRenderer.invoke("git:show", hash),
  diff: (options) => electron.ipcRenderer.invoke("git:diff", options),
  getFileDiff: (hash, file) => electron.ipcRenderer.invoke("git:getFileDiff", hash, file)
});
