import { simpleGit, SimpleGit, StatusResult, LogResult, BranchSummary } from 'simple-git'

export class GitService {
  private git: SimpleGit

  constructor(basePath: string) {
    this.git = simpleGit(basePath)
  }

  async status(): Promise<StatusResult> {
    return await this.git.status()
  }

  async log(maxCount: number = 1000): Promise<LogResult> {
    const options: any = { 
      '--all': null, // Show all branches
      '--topo-order': null, // Sort commits topologically
      format: {
        hash: '%H',
        parents: '%P',
        author_name: '%an',
        author_email: '%ae',
        date: '%ad',
        message: '%s',
        refs: '%D'
      }
    }
    if (maxCount > 0) options.maxCount = maxCount
    return await this.git.log(options)
  }

  async branches(): Promise<BranchSummary> {
    return await this.git.branch()
  }

  async checkout(branchName: string) {
    return await this.git.checkout(branchName)
  }

  async pull() {
    return await this.git.pull()
  }

  async push() {
    return await this.git.push()
  }

  async fetch() {
    return await this.git.fetch()
  }

  async merge(fromBranch: string) {
    return await this.git.merge([fromBranch])
  }

  async add(files: string | string[]) {
    return await this.git.add(files)
  }

  async commit(message: string) {
    return await this.git.commit(message)
  }

  async show(hash: string) {
    return await this.git.show([hash, '--name-status', '--format=%b'])
  }

  async diff(options?: string[]) {
    return await this.git.diff(options)
  }

  async getRemotes() {
    return await this.git.getRemotes(true)
  }

  async getFileDiff(hash: string, file: string) {
    // Get unified diff with 3 lines of context
    return await this.git.show([hash, '--unified=3', '--', file])
  }
}
