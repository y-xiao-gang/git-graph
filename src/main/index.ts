import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { GitService } from './git-service'

let mainWindow: BrowserWindow | null = null
let gitService: GitService | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC Handlers
ipcMain.handle('git:open-repo', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const repoPath = result.filePaths[0]
    gitService = new GitService(repoPath)
    return repoPath
  }
  return null
})

ipcMain.handle('git:status', async () => {
  const status = await gitService?.status()
  return status ? JSON.parse(JSON.stringify(status)) : null
})

ipcMain.handle('git:log', async (_, maxCount) => {
  const log = await gitService?.log(maxCount)
  return log ? JSON.parse(JSON.stringify(log)) : null
})

ipcMain.handle('git:branches', async () => {
  const branches = await gitService?.branches()
  return branches ? JSON.parse(JSON.stringify(branches)) : null
})

ipcMain.handle('git:checkout', async (_, branchName) => {
  return await gitService?.checkout(branchName)
})

ipcMain.handle('git:pull', async () => {
  return await gitService?.pull()
})

ipcMain.handle('git:push', async () => {
  return await gitService?.push()
})

ipcMain.handle('git:merge', async (_, fromBranch) => {
  return await gitService?.merge(fromBranch)
})

ipcMain.handle('git:add', async (_, files) => {
  return await gitService?.add(files)
})

ipcMain.handle('git:commit', async (_, message) => {
  return await gitService?.commit(message)
})

ipcMain.handle('git:show', async (_, hash) => {
  return await gitService?.show(hash)
})

ipcMain.handle('git:diff', async (_, options) => {
  return await gitService?.diff(options)
})

ipcMain.handle('git:getFileDiff', async (_, hash: string, file: string) => {
  // Get the diff for a specific file in a commit
  const diff = await gitService?.getFileDiff(hash, file)
  return diff || ''
})
