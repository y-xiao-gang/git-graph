import { defineStore } from 'pinia'

export const useGitStore = defineStore('git', {
  state: () => ({
    repoPath: '',
    status: null as any,
    branches: null as any,
    logs: [] as any[],
    currentBranch: '',
    loading: false
  }),
  actions: {
    async openRepo() {
      const path = await (window as any).electronAPI.openRepo()
      if (path) {
        this.repoPath = path
        await this.refreshAll()
      }
    },
    async refreshAll(maxCount: number = 1000) {
      if (!this.repoPath) return
      this.loading = true
      try {
        const [status, branches, logs] = await Promise.all([
          (window as any).electronAPI.getStatus(),
          (window as any).electronAPI.getBranches(),
          (window as any).electronAPI.getLog(maxCount)
        ])
        this.status = status
        this.branches = branches
        this.currentBranch = branches.current
        this.logs = logs.all
      } finally {
        this.loading = false
      }
    },
    async checkout(branchName: string) {
      await (window as any).electronAPI.checkout(branchName)
      await this.refreshAll()
    },
    async pull() {
      await (window as any).electronAPI.pull()
      await this.refreshAll()
    },
    async push() {
      await (window as any).electronAPI.push()
      await this.refreshAll()
    },
    async stageFile(file: string) {
      await (window as any).electronAPI.add(file)
      await this.refreshAll()
    },
    async commit(message: string) {
      await (window as any).electronAPI.commit(message)
      await this.refreshAll()
    },
    async getCommitDetails(hash: string) {
      return await (window as any).electronAPI.show(hash)
    },
    async getFileDiff(hash: string, file: string) {
      return await (window as any).electronAPI.getFileDiff(hash, file)
    }
  }
})
