"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const electron = require("electron");
const path = require("path");
const simpleGit = require("simple-git");
class GitService {
  constructor(basePath) {
    __publicField(this, "git");
    this.git = simpleGit.simpleGit(basePath);
  }
  async status() {
    return await this.git.status();
  }
  async log(maxCount = 1e3) {
    const options = {
      "--all": null,
      // Show all branches
      "--topo-order": null,
      // Sort commits topologically
      format: {
        hash: "%H",
        parents: "%P",
        author_name: "%an",
        author_email: "%ae",
        date: "%ad",
        message: "%s",
        refs: "%D"
      }
    };
    if (maxCount > 0) options.maxCount = maxCount;
    return await this.git.log(options);
  }
  async branches() {
    return await this.git.branch();
  }
  async checkout(branchName) {
    return await this.git.checkout(branchName);
  }
  async pull() {
    return await this.git.pull();
  }
  async push() {
    return await this.git.push();
  }
  async fetch() {
    return await this.git.fetch();
  }
  async merge(fromBranch) {
    return await this.git.merge([fromBranch]);
  }
  async add(files) {
    return await this.git.add(files);
  }
  async commit(message) {
    return await this.git.commit(message);
  }
  async show(hash) {
    return await this.git.show([hash, "--name-status", "--format=%b"]);
  }
  async diff(options) {
    return await this.git.diff(options);
  }
  async getRemotes() {
    return await this.git.getRemotes(true);
  }
  async getFileDiff(hash, file) {
    return await this.git.show([hash, "--unified=3", "--", file]);
  }
}
let mainWindow = null;
let gitService = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
electron.ipcMain.handle("git:open-repo", async () => {
  const result = await electron.dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const repoPath = result.filePaths[0];
    gitService = new GitService(repoPath);
    return repoPath;
  }
  return null;
});
electron.ipcMain.handle("git:status", async () => {
  const status = await (gitService == null ? void 0 : gitService.status());
  return status ? JSON.parse(JSON.stringify(status)) : null;
});
electron.ipcMain.handle("git:log", async (_, maxCount) => {
  const log = await (gitService == null ? void 0 : gitService.log(maxCount));
  return log ? JSON.parse(JSON.stringify(log)) : null;
});
electron.ipcMain.handle("git:branches", async () => {
  const branches = await (gitService == null ? void 0 : gitService.branches());
  return branches ? JSON.parse(JSON.stringify(branches)) : null;
});
electron.ipcMain.handle("git:checkout", async (_, branchName) => {
  return await (gitService == null ? void 0 : gitService.checkout(branchName));
});
electron.ipcMain.handle("git:pull", async () => {
  return await (gitService == null ? void 0 : gitService.pull());
});
electron.ipcMain.handle("git:push", async () => {
  return await (gitService == null ? void 0 : gitService.push());
});
electron.ipcMain.handle("git:merge", async (_, fromBranch) => {
  return await (gitService == null ? void 0 : gitService.merge(fromBranch));
});
electron.ipcMain.handle("git:add", async (_, files) => {
  return await (gitService == null ? void 0 : gitService.add(files));
});
electron.ipcMain.handle("git:commit", async (_, message) => {
  return await (gitService == null ? void 0 : gitService.commit(message));
});
electron.ipcMain.handle("git:show", async (_, hash) => {
  return await (gitService == null ? void 0 : gitService.show(hash));
});
electron.ipcMain.handle("git:diff", async (_, options) => {
  return await (gitService == null ? void 0 : gitService.diff(options));
});
electron.ipcMain.handle("git:getFileDiff", async (_, hash, file) => {
  const diff = await (gitService == null ? void 0 : gitService.getFileDiff(hash, file));
  return diff || "";
});
