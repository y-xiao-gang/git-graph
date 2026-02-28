/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI: {
    openRepo: () => Promise<string | null>
    getStatus: () => Promise<any>
    getLog: (maxCount?: number) => Promise<any>
    getBranches: () => Promise<any>
    checkout: (branchName: string) => Promise<any>
    pull: () => Promise<any>
    push: () => Promise<any>
    merge: (fromBranch: string) => Promise<any>
    add: (files: string | string[]) => Promise<any>
    commit: (message: string) => Promise<any>
    diff: (options?: string[]) => Promise<any>
  }
}
