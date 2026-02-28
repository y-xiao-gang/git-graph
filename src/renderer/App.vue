<template>
  <el-config-provider :button="{ autoInsertSpace: true }">
    <div class="app-container">
      <!-- Top Navigation Toolbar -->
      <div class="top-nav">
        <div class="top-left">
          <div class="repo-selector">
            <div class="repo-tag" @click="gitStore.openRepo">
              <el-icon><Folder /></el-icon>
              <span>{{ currentRepoName || 'Open Repo' }}</span>
            </div>
          </div>
        </div>
        
        <div class="action-group">
          <div class="tool-btn" title="Undo">
            <span class="btn-label">Undo</span>
            <el-icon><RefreshLeft /></el-icon>
          </div>
          <div class="tool-btn is-disabled" title="Redo">
            <span class="btn-label">Redo</span>
            <el-icon><RefreshRight /></el-icon>
          </div>
          <div class="tool-separator"></div>
          <div class="tool-btn has-dropdown" @click="gitStore.pull" title="Pull">
            <span class="btn-label">Pull</span>
            <div class="btn-content">
              <el-icon><Download /></el-icon>
              <el-icon class="dropdown-arrow"><CaretBottom /></el-icon>
            </div>
          </div>
          <div class="tool-btn" @click="gitStore.push" title="Push">
            <span class="btn-label">Push</span>
            <el-icon><Upload /></el-icon>
          </div>
          <div class="tool-btn" title="Branch">
            <span class="btn-label">Branch</span>
            <el-icon><Share /></el-icon>
          </div>
          <div class="tool-btn" title="Stash">
            <span class="btn-label">Stash</span>
            <el-icon><Suitcase /></el-icon>
          </div>
          <div class="tool-btn" title="Pop">
            <span class="btn-label">Pop</span>
            <el-icon><Memo /></el-icon>
          </div>
        </div>

        <div class="top-right-group">
          <el-checkbox 
            v-model="showAllCommits" 
            label="Show All" 
            size="small"
            class="all-commits-check"
            @change="handleShowAllChange"
          />
          <el-input 
            v-model="searchQuery" 
            placeholder="Search commits..." 
            size="small"
            prefix-icon="Search"
            class="search-input"
          />
          <div class="user-profile">
            <el-avatar :size="24" icon="UserFilled" />
          </div>
        </div>
      </div>

      <div class="main-layout">
        <!-- Left Sidebar: Repository Browser -->
        <div class="left-sidebar" :style="{ width: leftSidebarWidth + 'px' }">
          <div class="sidebar-search">
            <el-input v-model="sidebarFilter" placeholder="Filter (Ctrl + F)" size="small" prefix-icon="Filter" />
          </div>
          
          <div class="sidebar-sections">
            <!-- ... existing local section ... -->
            <div class="section">
              <div class="section-header" @click="toggleSection('local')">
                <el-icon :class="{ 'is-collapsed': !sections.local }"><CaretBottom /></el-icon>
                <el-icon><Monitor /></el-icon>
                <span>LOCAL</span>
                <span class="count">{{ localBranches.length }}</span>
              </div>
              <div v-show="sections.local" class="section-items nested">
                <template v-for="node in localTree" :key="node.path || node.fullName">
                  <!-- Local Folder Node -->
                  <template v-if="node.type === 'folder'">
                    <div class="item folder-item" @click="toggleFolder(node.path)">
                      <el-icon :class="{ 'is-collapsed': !expandedFolders.has(node.path) }"><CaretBottom /></el-icon>
                      <el-icon><Folder /></el-icon>
                      <span class="label truncate" :title="node.name">{{ node.name }}</span>
                    </div>
                    <div v-show="expandedFolders.has(node.path)" class="folder-children">
                      <div 
                        v-for="branch in node.children" 
                        :key="branch.fullName"
                        class="item branch-item mini"
                        :class="{ 'is-active': branch.current }"
                        @click="focusBranch(branch.fullName)"
                        @dblclick="gitStore.checkout(branch.fullName)"
                      >
                        <el-icon v-if="branch.current" class="current-icon"><Check /></el-icon>
                        <el-icon v-else><Share /></el-icon>
                        <span class="label truncate" :title="branch.fullName">{{ branch.name }}</span>
                      </div>
                    </div>
                  </template>
                  <!-- Local Branch Node (Top Level) -->
                  <template v-else>
                    <div 
                      class="item branch-item"
                      :class="{ 'is-active': node.current }"
                      @click="focusBranch(node.fullName)"
                      @dblclick="gitStore.checkout(node.fullName)"
                    >
                      <div class="indent-placeholder"></div>
                      <el-icon v-if="node.current" class="current-icon"><Check /></el-icon>
                      <el-icon v-else><Share /></el-icon>
                      <span class="label truncate" :title="node.fullName">{{ node.name }}</span>
                    </div>
                  </template>
                </template>
              </div>
            </div>

            <div class="section">
              <div class="section-header" @click="toggleSection('remote')">
                <el-icon :class="{ 'is-collapsed': !sections.remote }"><CaretBottom /></el-icon>
                <span>REMOTE</span>
                <span class="count">{{ remoteBranches.length }}</span>
              </div>
              <div v-show="sections.remote" class="section-items nested">
                <div v-for="remote in remoteTree" :key="remote.name" class="remote-group">
                  <div class="item remote-header" @click="toggleRemote(remote.name)">
                    <el-icon :class="{ 'is-collapsed': !expandedRemotes.has(remote.name) }"><CaretBottom /></el-icon>
                    <el-icon><Management /></el-icon>
                    <span class="label truncate" :title="remote.name">{{ remote.name }}</span>
                  </div>
                  <div v-show="expandedRemotes.has(remote.name)" class="remote-children">
                    <template v-for="node in remote.children" :key="node.path">
                      <!-- Folder Node -->
                      <template v-if="node.type === 'folder'">
                        <div class="item folder-item" @click="toggleFolder(node.path)">
                          <el-icon :class="{ 'is-collapsed': !expandedFolders.has(node.path) }"><CaretBottom /></el-icon>
                          <el-icon><Folder /></el-icon>
                          <span class="label truncate" :title="node.path">{{ node.name }}</span>
                        </div>
                        <div v-show="expandedFolders.has(node.path)" class="folder-children">
                          <div 
                            v-for="branch in node.children" 
                            :key="branch.fullName"
                            class="item branch-item mini"
                            @click="focusBranch(branch.fullName)"
                            @dblclick="gitStore.checkout(branch.fullName)"
                          >
                            <el-icon><Share /></el-icon>
                            <span class="label truncate" :title="branch.fullName">{{ branch.name }}</span>
                          </div>
                        </div>
                      </template>
                      <!-- Branch Node (Top Level) -->
                      <template v-else>
                        <div 
                          class="item branch-item mini"
                          @click="focusBranch(node.fullName)"
                          @dblclick="gitStore.checkout(node.fullName)"
                        >
                          <div class="indent-placeholder"></div>
                          <el-icon><Share /></el-icon>
                          <span class="label truncate" :title="node.fullName">{{ node.name }}</span>
                        </div>
                      </template>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-header">
                <el-icon class="is-collapsed"><CaretBottom /></el-icon>
                <span>TAGS</span>
                <span class="count">0/0</span>
              </div>
            </div>

            <div class="section">
              <div class="section-header">
                <el-icon class="is-collapsed"><CaretBottom /></el-icon>
                <span>SUBMODULES</span>
                <span class="count">0</span>
              </div>
            </div>
          </div>
        </div>

        <div class="resizer" @mousedown="startResizing('left')"></div>

        <!-- Center: Commit Graph & List -->
        <div class="center-view">
          <!-- ... existing content ... -->
          <div class="commit-list-header">
            <div class="col-tags">Branch</div>
            <div class="col-graph-viewport" :style="{ width: graphColumnWidth + 'px' }">
              <div class="header-label">Graph</div>
            </div>
            <div class="resizer-mini" @mousedown="startResizing('graph')"></div>
            <div class="col-message">Description</div>
            <div class="col-author">Author</div>
            <div class="col-date">Date</div>
          </div>
          <div class="commit-list-content">
            <div 
              v-for="(commit, index) in commitsWithLanes" 
              :key="commit.hash" 
              class="commit-row"
              :class="{ 
                'is-selected': selectedCommitHash === commit.hash,
                'is-mainline': commit.isMainline 
              }"
              :data-hash="commit.hash"
              @click="selectCommit(commit)"
            >
              <div class="col-tags">
                <div class="commit-tags">
                  <span 
                    v-for="tag in commit.branchTags" 
                    :key="tag" 
                    class="branch-tag"
                    :style="{ backgroundColor: getTagColor(tag) }"
                    :title="tag"
                  >
                    <el-icon v-if="tag === gitStore.currentBranch"><Check /></el-icon>
                    {{ tag }}
                  </span>
                </div>
                <!-- Horizontal connector line -->
                <div v-if="commit.branchTags.length > 0" class="connector-line"></div>
              </div>
              <div class="col-graph-viewport" :style="{ width: graphColumnWidth + 'px' }">
                <div class="graph-inner">
                  <svg class="graph-svg" :style="{ width: '100%' }">
                    <!-- Continuous Lane Segments -->
                    <template v-for="(segment, sIdx) in commit.segments" :key="sIdx">
                      <path 
                        :d="segment.path" 
                        :stroke="segment.color" 
                        fill="none" 
                        stroke-width="3"
                        stroke-linecap="round"
                        class="graph-path"
                      />
                    </template>
                    <!-- Node -->
                    <g class="node-group">
                      <circle 
                        :cx="commit.laneX" 
                        cy="18" 
                        r="10" 
                        :fill="commit.color" 
                        :stroke="'#111213'" 
                        stroke-width="1.5"
                        class="graph-node-circle"
                      />
                      <text 
                        :x="commit.laneX" 
                        y="21.5" 
                        text-anchor="middle" 
                        fill="white" 
                        font-size="10" 
                        font-weight="bold"
                        class="node-text"
                      >
                        {{ commit.author_name.charAt(0).toUpperCase() }}
                      </text>
                    </g>
                  </svg>
                </div>
              </div>
              <div class="resizer-mini is-placeholder"></div>
              <div class="col-message">
                <span class="commit-msg" :title="commit.message">{{ commit.message }}</span>
              </div>
              <div class="col-author">{{ commit.author_name }}</div>
              <div class="col-date">{{ formatDate(commit.date) }}</div>
            </div>
          </div>

          <!-- File Diff Overlay in Center - Left side only -->
          <div v-if="diffFile" class="center-diff-overlay">
            <div class="diff-header">
              <div class="diff-file-info">
                <el-icon><Document /></el-icon>
                <span class="diff-path">{{ diffFile.path }}</span>
              </div>
              <div class="close-btn-container">
                <el-button circle size="small" @click="closeDiff" class="custom-close-btn">
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="diff-body" ref="diffBodyRef">
              <div class="diff-split-view">
                <div class="diff-side diff-old" ref="oldSideRef" @scroll="syncScroll('old')">
                  <div class="diff-side-header">Old</div>
                  <div class="diff-side-content">
                    <div v-for="(line, idx) in parsedDiff.oldLines" :key="'old-'+idx" 
                         class="diff-line" :class="line.type">
                      <span class="line-num">{{ line.num }}</span>
                      <span class="line-content">{{ line.content }}</span>
                    </div>
                  </div>
                </div>
                <div class="diff-side diff-new" ref="newSideRef" @scroll="syncScroll('new')">
                  <div class="diff-side-header">New</div>
                  <div class="diff-side-content">
                    <div v-for="(line, idx) in parsedDiff.newLines" :key="'new-'+idx" 
                         class="diff-line" :class="line.type">
                      <span class="line-num">{{ line.num }}</span>
                      <span class="line-content">{{ line.content }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="resizer" @mousedown="startResizing('right')"></div>

        <!-- Right Sidebar: Commit Details / Staging -->
        <div class="right-sidebar" :style="{ width: rightSidebarWidth + 'px' }">
          <template v-if="!selectedCommit">
            <div class="staging-panel">
              <div class="panel-header">UNSTAGED CHANGES</div>
              <div class="file-list">
                <div v-for="file in gitStore.status?.files" :key="file.path" class="file-item">
                  <el-checkbox @change="() => gitStore.stageFile(file.path)">
                    <span :class="'status-' + file.working_dir.toLowerCase()">{{ file.working_dir }}</span>
                    {{ file.path }}
                  </el-checkbox>
                </div>
              </div>
              <div class="commit-area">
                <el-input
                  v-model="commitMessage"
                  type="textarea"
                  placeholder="Commit message..."
                  :rows="4"
                  class="dark-textarea"
                />
                <el-button type="success" class="commit-btn" @click="handleCommit">
                  Commit Changes
                </el-button>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="commit-details">
              <div class="details-header">
                <div class="commit-info">
                  <div class="hash">commit: {{ selectedCommit.hash.substring(0, 7) }}</div>
                  <div class="author-line">
                    <div class="author-avatar" :style="{ backgroundColor: selectedCommit.color }">
                      {{ selectedCommit.author_name.charAt(0).toUpperCase() }}
                    </div>
                    <div class="author-meta">
                      <strong>{{ selectedCommit.author_name }}</strong>
                      <span>authored {{ formatDate(selectedCommit.date) }}</span>
                    </div>
                  </div>
                  <div v-if="selectedCommit.parents" class="parents-line">
                    <span class="label">Parents:</span>
                    <div class="parent-hashes">
                      <span 
                        v-for="parent in selectedCommit.parents.split(' ')" 
                        :key="parent"
                        class="parent-hash-link"
                        @click="jumpToCommit(parent)"
                      >
                        {{ parent.substring(0, 7) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="commit-message-full">
                {{ selectedCommit.message }}
              </div>

              <div class="details-toolbar">
                <div class="file-count-row">
                  <el-icon><EditPen /></el-icon>
                  <span>{{ commitFiles.length }} modified</span>
                </div>
                <div class="toolbar-actions-row">
                  <div class="sort-action" @click="toggleSortOrder" title="Sort files">
                    <el-icon><Sort /></el-icon>
                  </div>
                  <div class="mode-switch-group">
                    <div 
                      class="mode-switch-btn" 
                      :class="{ 'is-active': viewMode === 'path' }"
                      @click="viewMode = 'path'"
                    >
                      <el-icon><List /></el-icon> Path
                    </div>
                    <div 
                      class="mode-switch-btn" 
                      :class="{ 'is-active': viewMode === 'tree' }"
                      @click="viewMode = 'tree'"
                    >
                      <el-icon><Operation /></el-icon> Tree
                    </div>
                  </div>
                  <div class="view-all-files">
                    <el-checkbox v-model="viewAllFiles" size="small">View all files</el-checkbox>
                  </div>
                </div>
              </div>

              <div class="files-container" ref="filesContainerRef">
                <!-- Path View -->
                <div v-if="viewMode === 'path'" class="modified-files-list">
                  <div 
                    v-for="file in sortedCommitFiles" 
                    :key="file.path" 
                    class="file-item-mini"
                    :class="{ 'is-active': diffFile?.path === file.path }"
                    @click="viewFileDiff(file)"
                  >
                    <el-icon class="file-status-icon" :class="'status-' + file.status.toLowerCase()">
                      <EditPen v-if="file.status === 'M'" />
                      <Plus v-else-if="file.status === 'A'" />
                      <Delete v-else-if="file.status === 'D'" />
                      <Document v-else />
                    </el-icon>
                    <span class="file-path" :title="file.path">{{ file.path }}</span>
                  </div>
                </div>
                <!-- Tree View -->
                <div v-else class="tree-view-container">
                  <el-tree
                    :data="commitFileTree"
                    :props="{ label: 'name', children: 'children' }"
                    node-key="path"
                    default-expand-all
                    highlight-current
                    class="dark-tree"
                    @node-click="(data) => data.type !== 'folder' && viewFileDiff(data)"
                  >
                    <template #default="{ node, data }">
                      <div class="custom-tree-node" :class="{ 'is-active': diffFile?.path === data.path }">
                        <el-icon v-if="data.type === 'folder'"><Folder /></el-icon>
                        <el-icon v-else class="file-status-icon" :class="'status-' + (data.status?.toLowerCase() || '')">
                          <Document />
                        </el-icon>
                        <span class="truncate">{{ node.label }}</span>
                      </div>
                    </template>
                  </el-tree>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from 'vue'
import { useGitStore } from './store/git'
import { 
  Folder, Download, Upload, Share, RefreshLeft, RefreshRight, 
  Suitcase, Memo, Search, UserFilled, CaretBottom, Cloudy, 
  Filter, Close, Management, Check, Monitor, EditPen, Sort, 
  List, Operation, Plus, Delete, Document
} from '@element-plus/icons-vue'

const gitStore = useGitStore()
const searchQuery = ref('')
const sidebarFilter = ref('')
const commitMessage = ref('')
const selectedCommit = ref<any>(null)
const selectedCommitHash = computed(() => selectedCommit.value?.hash)
const commitFiles = ref<any[]>([])
const viewMode = ref<'path' | 'tree'>('path')
const sortOrder = ref<'asc' | 'desc'>('asc')
const viewAllFiles = ref(false)
const maxCommits = ref(1000)
const showAllCommits = ref(false)
const graphColumnWidth = ref(240) // Default width for Graph column
const diffFile = ref<any>(null)
const diffContent = ref('')
const filesContainerRef = ref<HTMLElement | null>(null)
const diffOverlayTop = ref(0)
const oldSideRef = ref<HTMLElement | null>(null)
const newSideRef = ref<HTMLElement | null>(null)
const isSyncing = ref(false)

const expandedRemotes = ref(new Set<string>(['origin']))
const expandedFolders = ref(new Set<string>())
const leftSidebarWidth = ref(240)
const rightSidebarWidth = ref(400) // Increased initial width
const resizingSide = ref<'left' | 'right' | 'graph' | null>(null)

const diffOverlayStyle = computed(() => ({
  top: diffOverlayTop.value + 'px'
}))

const handleShowAllChange = (val: boolean) => {
  maxCommits.value = val ? 0 : 1000 // 0 means all in our new GitService.log
  gitStore.refreshAll(maxCommits.value)
}

const sections = reactive({
  local: true,
  remote: true,
  tags: true,
  submodules: true
})

const sortedCommitFiles = computed(() => {
  const files = [...commitFiles.value]
  files.sort((a, b) => {
    const comparison = a.path.localeCompare(b.path)
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
  return files
})

const commitFileTree = computed(() => {
  const root: any[] = []
  const files = sortedCommitFiles.value

  files.forEach(file => {
    const parts = file.path.split('/')
    let currentLevel = root

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      const existing = currentLevel.find(item => item.name === part)

      if (existing) {
        if (!isLast) currentLevel = existing.children
      } else {
        const newNode: any = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: isLast ? 'file' : 'folder',
          status: isLast ? file.status : null,
          children: isLast ? null : []
        }
        currentLevel.push(newNode)
        if (!isLast) currentLevel = newNode.children
      }
    })
  })
  return root
})

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const startResizing = (side: 'left' | 'right' | 'graph') => {
  resizingSide.value = side
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResizing)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleMouseMove = (e: MouseEvent) => {
  if (resizingSide.value === 'left') {
    const newWidth = e.clientX
    if (newWidth > 150 && newWidth < 500) {
      leftSidebarWidth.value = newWidth
    }
  } else if (resizingSide.value === 'right') {
    const newWidth = window.innerWidth - e.clientX
    // Increased min-width to 380px to ensure toolbar fits in one line
    if (newWidth > 380 && newWidth < 800) {
      rightSidebarWidth.value = newWidth
    }
  } else if (resizingSide.value === 'graph') {
    // Calculate new width for graph column
    // The graph column starts after the left sidebar, the left resizer (4px), and the Branch column (220px)
    const leftOffset = leftSidebarWidth.value + 4 + 220 
    const newWidth = e.clientX - leftOffset
    if (newWidth > 50 && newWidth < 1000) {
      graphColumnWidth.value = newWidth
    }
  }
}

const stopResizing = () => {
  resizingSide.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResizing)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

const currentRepoName = computed(() => {
  if (!gitStore.repoPath) return ''
  return gitStore.repoPath.split(/[\\\/]/).pop()
})

const localBranches = computed(() => {
  if (!gitStore.branches) return []
  const filter = sidebarFilter.value.toLowerCase()
  return Object.values(gitStore.branches.branches)
    .filter((b: any) => !b.name.startsWith('remotes/') && b.name.toLowerCase().includes(filter))
})

const localTree = computed(() => {
  const branches = localBranches.value
  const tree: any[] = []
  const nodes = new Map<string, any>()

  branches.forEach((branch: any) => {
    const parts = branch.name.split('/')
    
    if (parts.length > 1) {
      const folderName = parts[0]
      const branchName = parts.slice(1).join('/')
      const folderPath = `local/${folderName}`

      if (!nodes.has(folderName)) {
        const folderNode = {
          type: 'folder',
          name: folderName,
          path: folderPath,
          children: []
        }
        nodes.set(folderName, folderNode)
        tree.push(folderNode)
      }
      nodes.get(folderName).children.push({
        type: 'branch',
        name: branchName,
        fullName: branch.name,
        current: branch.current
      })
    } else {
      tree.push({
        type: 'branch',
        name: branch.name,
        fullName: branch.name,
        current: branch.current
      })
    }
  })
  return tree
})

const remoteBranches = computed(() => {
  if (!gitStore.branches) return []
  const filter = sidebarFilter.value.toLowerCase()
  return Object.keys(gitStore.branches.branches)
    .filter(name => name.startsWith('remotes/') && name.toLowerCase().includes(filter))
})

const remoteTree = computed(() => {
  const branches = remoteBranches.value
  const tree: any[] = []
  const remotesMap = new Map<string, any>()

  branches.forEach(fullName => {
    // "remotes/origin/feature/xxx" -> ["remotes", "origin", "feature", "xxx"]
    const parts = fullName.split('/')
    if (parts.length < 3) return

    const remoteName = parts[1]
    const relativePath = parts.slice(2) // ["feature", "xxx"] or ["master"]

    if (!remotesMap.has(remoteName)) {
      const remoteObj = { name: remoteName, children: [], nodes: new Map<string, any>() }
      remotesMap.set(remoteName, remoteObj)
      tree.push(remoteObj)
    }

    const remote = remotesMap.get(remoteName)
    
    if (relativePath.length > 1) {
      // It's in a folder (e.g., feature/xxx)
      const folderName = relativePath[0]
      const branchName = relativePath.slice(1).join('/')
      const folderPath = `${remoteName}/${folderName}`

      if (!remote.nodes.has(folderName)) {
        const folderNode = { 
          type: 'folder', 
          name: folderName, 
          path: folderPath,
          children: [] 
        }
        remote.nodes.set(folderName, folderNode)
        remote.children.push(folderNode)
      }
      
      remote.nodes.get(folderName).children.push({
        type: 'branch',
        name: branchName,
        fullName: fullName
      })
    } else {
      // It's a top-level branch (e.g., master)
      remote.children.push({
        type: 'branch',
        name: relativePath[0],
        fullName: fullName
      })
    }
  })

  return tree
})

const filteredLogs = computed(() => {
  if (!searchQuery.value) return gitStore.logs
  const q = searchQuery.value.toLowerCase()
  return gitStore.logs.filter(l => 
    l.message.toLowerCase().includes(q) || 
    l.author_name.toLowerCase().includes(q) ||
    l.hash.includes(q)
  )
})

const LANE_WIDTH = 20 // Standard lane width for consistency

const graphWidth = computed(() => {
  if (!commitsWithLanes.value.length) return 120
  let max = 0
  commitsWithLanes.value.forEach(c => {
    max = Math.max(max, c.laneIndex + 1)
    c.segments.forEach((s: any) => {
      // Basic check for parent lane indices would be more complex, 
      // but laneIndex + 1 is a good safe minimum.
    })
  })
  // Ensure enough space for the furthest lane + some padding
  return Math.max(120, (max + 1) * LANE_WIDTH)
})

const commitsWithLanes = computed(() => {
  const logs = filteredLogs.value
  if (!logs.length) return []

  const ROW_HEIGHT = 36
  const NODE_Y = 18
  
  let activeLanes: { hash: string, laneIndex: number }[] = []
  
  return logs.map((commit, index) => {
    let laneIndex = activeLanes.findIndex(l => l.hash === commit.hash)
    if (laneIndex === -1) {
      laneIndex = 0
      const takenLanes = activeLanes.map(l => l.laneIndex)
      while (takenLanes.includes(laneIndex)) laneIndex++
    } else {
      laneIndex = activeLanes[laneIndex].laneIndex
      activeLanes = activeLanes.filter(l => l.hash !== commit.hash)
    }

    const laneX = (laneIndex + 0.5) * LANE_WIDTH 
    const color = getLaneColor(laneIndex)

    const passingLanes = activeLanes.map(l => ({
      x: (l.laneIndex + 0.5) * LANE_WIDTH,
      color: getLaneColor(l.laneIndex)
    }))

    const parents = (commit as any).parents ? (commit as any).parents.split(' ').filter(Boolean) : []
    const segments: any[] = []

    segments.push({
      path: `M ${laneX} 0 L ${laneX} ${NODE_Y}`,
      color
    })

    parents.forEach((parentHash) => {
      let parentLane = activeLanes.findIndex(l => l.hash === parentHash)
      let parentLaneIndex: number

      if (parentLane === -1) {
        parentLaneIndex = laneIndex
        if (activeLanes.some(l => l.laneIndex === parentLaneIndex)) {
          parentLaneIndex = 0
          const taken = activeLanes.map(l => l.laneIndex)
          while (taken.includes(parentLaneIndex) || parentLaneIndex === laneIndex) parentLaneIndex++
        }
        activeLanes.push({ hash: parentHash, laneIndex: parentLaneIndex })
      } else {
        parentLaneIndex = activeLanes[parentLane].laneIndex
      }

      const parentX = (parentLaneIndex + 0.5) * LANE_WIDTH
      const parentColor = getLaneColor(parentLaneIndex)

      if (parentX === laneX) {
        segments.push({
          path: `M ${laneX} ${NODE_Y} L ${laneX} ${ROW_HEIGHT}`,
          color
        })
      } else {
        segments.push({
          path: `M ${laneX} ${NODE_Y} C ${laneX} ${NODE_Y + 12}, ${parentX} ${NODE_Y + 12}, ${parentX} ${ROW_HEIGHT}`,
          color: parentColor
        })
      }
    })

    passingLanes.forEach(lane => {
      segments.push({
        path: `M ${lane.x} 0 L ${lane.x} ${ROW_HEIGHT}`,
        color: lane.color
      })
    })

    const branchTags: string[] = []
    if ((commit as any).refs) {
      const refsStr = (commit as any).refs as string
      refsStr.split(',').forEach(ref => {
        const cleaned = ref.replace('HEAD ->', '').trim()
        if (cleaned) branchTags.push(cleaned)
      })
    }

    const isMainline = branchTags.some(tag => tag === gitStore.currentBranch)

    return {
      ...commit,
      laneIndex,
      laneX,
      color,
      segments,
      branchTags,
      isMainline
    }
  })
})

const parsedDiff = computed(() => {
  if (!diffContent.value) return { oldLines: [], newLines: [] }
  
  const lines = diffContent.value.split('\n')
  const oldLines: any[] = []
  const newLines: any[] = []
  let oldNum = 0
  let newNum = 0
  
  for (const line of lines) {
    if (line.startsWith('@@')) {
      // Parse hunk header like @@ -1,3 +1,4 @@
      const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/)
      if (match) {
        oldNum = parseInt(match[1])
        newNum = parseInt(match[3])
        oldLines.push({ num: '...', content: line, type: 'hunk' })
        newLines.push({ num: '...', content: line, type: 'hunk' })
      }
    } else if (line.startsWith('-')) {
      oldLines.push({ num: oldNum++, content: line.substring(1), type: 'removed' })
    } else if (line.startsWith('+')) {
      newLines.push({ num: newNum++, content: line.substring(1), type: 'added' })
    } else if (line.startsWith(' ')) {
      const content = line.substring(1)
      oldLines.push({ num: oldNum++, content, type: 'normal' })
      newLines.push({ num: newNum++, content, type: 'normal' })
    } else if (line.startsWith('\\')) {
      // "\ No newline at end of file"
      oldLines.push({ num: '', content: line, type: 'info' })
      newLines.push({ num: '', content: line, type: 'info' })
    }
  }
  
  return { oldLines, newLines }
})

const getLaneColor = (index: number) => {
  const colors = [
    '#409eff', // Blue
    '#67c23a', // Green
    '#e6a23c', // Orange
    '#f56c6c', // Red
    '#9c27b0', // Purple
    '#00bcd4', // Cyan
    '#ffeb3b', // Yellow
    '#795548'  // Brown
  ]
  return colors[index % colors.length]
}

const getTagColor = (tagName: string) => {
  // Try to find if this commit's lane matches this tag
  // For consistency, we'll use a deterministic hash but stable for the same branch name
  let hash = 0
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = [
    '#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#9c27b0', '#00bcd4', '#ffeb3b', '#795548'
  ]
  return colors[Math.abs(hash) % colors.length]
}

const focusBranch = (branchName: string) => {
  // 1. Clear search to ensure the commit is in the list
  searchQuery.value = ''

  // 2. Normalize branch name
  const normalizedSearchName = branchName.replace(/^remotes\//, '')
  
  // 3. Find the latest commit for this branch
  const commit = commitsWithLanes.value.find(c => 
    c.branchTags.some(tag => {
      const normalizedTag = tag.trim()
      return normalizedTag === normalizedSearchName || 
             normalizedTag === branchName ||
             (normalizedSearchName.includes('/') && normalizedTag === normalizedSearchName.split('/').slice(1).join('/'))
    })
  )

  if (commit) {
    selectCommit(commit)
    
    // 4. Scroll to row
    setTimeout(() => {
      const rowEl = document.querySelector(`[data-hash="${commit.hash}"]`) as HTMLElement
      const scrollContainer = document.querySelector('.commit-list-content') as HTMLElement
      
      if (rowEl && scrollContainer) {
        // Use offsetTop relative to the scroll container
        // Ensure scrollContainer is the offsetParent by adding position: relative in CSS if needed
        const targetTop = rowEl.offsetTop - (scrollContainer.clientHeight / 2) + (rowEl.clientHeight / 2)
        scrollContainer.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        })
      }
    }, 50)
  }
}

const jumpToCommit = (hash: string) => {
  const commit = commitsWithLanes.value.find(c => c.hash.startsWith(hash) || hash.startsWith(c.hash))
  if (commit) {
    selectCommit(commit)
    nextTick(() => {
      const rowEl = document.querySelector(`[data-hash="${commit.hash}"]`) as HTMLElement
      const verticalContainer = document.querySelector('.commit-list-content') as HTMLElement
      if (rowEl && verticalContainer) {
        const targetTop = rowEl.offsetTop - (verticalContainer.clientHeight / 2) + (rowEl.clientHeight / 2)
        verticalContainer.scrollTo({ top: targetTop, behavior: 'smooth' })
      }
    })
  }
}

const toggleSection = (section: keyof typeof sections) => {
  sections[section] = !sections[section]
}

const toggleRemote = (name: string) => {
  if (expandedRemotes.value.has(name)) {
    expandedRemotes.value.delete(name)
  } else {
    expandedRemotes.value.add(name)
  }
}

const toggleFolder = (path: string) => {
  if (expandedFolders.value.has(path)) {
    expandedFolders.value.delete(path)
  } else {
    expandedFolders.value.add(path)
  }
}

const selectCommit = async (commit: any) => {
  if (!commit) {
    selectedCommit.value = null
    commitFiles.value = []
    diffFile.value = null
    return
  }
  selectedCommit.value = commit
  diffFile.value = null // Clear previous diff view when switching commits
  const details = await gitStore.getCommitDetails(commit.hash)
  // Parse name-status output
  const lines = details.split('\n').filter((l: string) => l.trim())
  commitFiles.value = lines.map((l: string) => {
    const [status, path] = l.split('\t')
    return { status, path }
  }).filter((f: any) => f.path)
}

const viewFileDiff = async (file: any) => {
  diffFile.value = file
  
  // Get actual diff content from git
  if (selectedCommit.value && selectedCommit.value.hash) {
    try {
      const diff = await gitStore.getFileDiff(selectedCommit.value.hash, file.path)
      diffContent.value = diff || 'No changes to display'
    } catch (e: any) {
      diffContent.value = `Error loading diff: ${e.message}`
    }
  } else {
    diffContent.value = 'No commit selected'
  }
}

const closeDiff = () => {
  diffFile.value = null
  diffContent.value = ''
}

const syncScroll = (source: 'old' | 'new') => {
  if (isSyncing.value) return
  isSyncing.value = true
  
  const sourceEl = source === 'old' ? oldSideRef.value : newSideRef.value
  const targetEl = source === 'old' ? newSideRef.value : oldSideRef.value
  
  if (sourceEl && targetEl) {
    targetEl.scrollTop = sourceEl.scrollTop
  }
  
  // Reset syncing flag after a short delay
  setTimeout(() => {
    isSyncing.value = false
  }, 10)
}

// Watch for log changes (e.g. after checkout) and select the latest commit
watch(() => gitStore.logs, (newLogs) => {
  if (newLogs && newLogs.length > 0) {
    selectCommit(newLogs[0])
  } else {
    selectCommit(null)
  }
}, { immediate: true })

const handleCommit = async () => {
  try {
    await gitStore.commit(commitMessage.value)
    commitMessage.value = ''
    ElMessage.success('Committed successfully')
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getRandomColor = (name: string) => {
  const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#9c27b0']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
</script>

<style>
* {
  box-sizing: border-box;
}

:root {
  --bg-darker: #111213;
  --bg-dark: #1c1e20;
  --bg-medium: #25282b;
  --bg-light: #2d3136;
  --text-main: #d1d5da;
  --text-muted: #8b949e;
  --accent-green: #2ea043;
  --accent-blue: #58a6ff;
  --border-color: #30363d;
}

body {
  margin: 0;
  background-color: var(--bg-darker);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  overflow: hidden;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Top Navigation */
.top-nav {
  height: 56px;
  background-color: var(--bg-dark);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 12px;
  justify-content: space-between;
}

.top-left {
  flex: 1;
  display: flex;
  align-items: center;
}

.repo-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background-color: var(--bg-light);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 12px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border-radius: 4px;
  min-width: 44px;
  padding: 4px 0;
  transition: all 0.2s;
  color: var(--text-main);
}

.tool-btn:hover:not(.is-disabled) {
  background-color: var(--bg-light);
}

.tool-btn.is-disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-label {
  font-size: 10px;
  margin-bottom: 2px;
  color: var(--text-muted);
}

.tool-btn .el-icon {
  font-size: 18px;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 2px;
}

.dropdown-arrow {
  font-size: 10px !important;
  opacity: 0.6;
}

.tool-separator {
  width: 1px;
  height: 24px;
  background-color: var(--border-color);
  margin: 0 4px;
}

.top-right-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
}

.all-commits-check {
  margin-right: 8px;
}

.all-commits-check .el-checkbox__label {
  color: var(--text-muted);
  font-size: 12px;
}

.search-input { width: 200px; }

/* Main Layout */
.main-layout { display: flex; flex: 1; overflow: hidden; }

/* Sidebar */
.left-sidebar {
  background-color: var(--bg-dark);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.resizer {
  width: 4px;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
  z-index: 10;
  flex-shrink: 0;
}

.resizer:hover, .resizer:active {
  background-color: var(--accent-blue);
}

.sidebar-search { padding: 10px; border-bottom: 1px solid var(--border-color); }

.sidebar-sections { flex: 1; overflow-y: auto; padding-top: 8px; }

.section-header {
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
}

.section-header .el-icon { transition: transform 0.2s; font-size: 12px; }

.section-header .el-icon.is-collapsed { transform: rotate(-90deg); }

.section-header .count { margin-left: auto; background-color: var(--bg-light); padding: 0 6px; border-radius: 10px; }

.section-items { padding: 4px 0; }

.indent-placeholder {
  width: 14px; /* Matches the width of the CaretBottom icon + gap */
  flex-shrink: 0;
}

.item {
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  cursor: pointer;
  padding-left: 12px; /* Standardize base padding */
}

.indent-placeholder {
  width: 14px; 
  flex-shrink: 0;
}

.folder-item .el-icon:first-child {
  width: 14px;
  display: flex;
  justify-content: center;
}

.item:hover { background-color: var(--bg-light); }

.label.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.current-icon {
  color: #56d364;
}

.item.is-active {
  background-color: rgba(46, 160, 67, 0.15);
  color: #56d364;
  border-left: 3px solid var(--accent-green);
  padding-left: 9px; /* 12px - 3px border */
}

.folder-children .item {
  padding-left: 32px;
}

.folder-children .item.is-active {
  padding-left: 29px; /* 32px - 3px border */
}

.remote-header {
  padding-left: 12px;
  color: var(--text-main);
}

.remote-children .item {
  padding-left: 32px;
}

.remote-children .folder-children .item {
  padding-left: 52px;
}

.remote-children {
  margin-top: 2px;
}

.folder-item {
  padding-left: 40px;
  color: var(--text-muted);
}

.folder-item .el-icon:first-child {
  font-size: 10px;
  margin-right: 4px;
}

.folder-children {
  margin-top: 2px;
}

.item.branch-item.mini {
  padding-left: 60px;
  font-size: 12px;
}

.remote-children .item.branch-item.mini {
  padding-left: 60px;
}

.folder-children .item.branch-item.mini {
  padding-left: 80px;
}

.item .el-icon {
  font-size: 14px;
}

/* Center: Commit Graph & List */
.center-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-darker);
  min-width: 0;
  overflow: hidden; /* Main view no longer scrolls horizontally */
}

.commit-list-header {
  display: flex;
  height: 32px;
  background-color: var(--bg-dark);
  border-bottom: 1px solid var(--border-color);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 20;
  width: 100%;
}

.commit-list-content {
  flex: 1;
  overflow-y: auto;
  width: 100%;
  position: relative; /* Ensure offsetTop of children is relative to this container */
}

.center-diff-overlay {
  position: absolute;
  top: 32px;
  left: 0;
  width: 65%;
  bottom: 0;
  background-color: var(--bg-darker);
  z-index: 50;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
}

.commit-row {
  display: flex;
  height: 36px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  align-items: center;
  transition: background-color 0.1s;
  width: 100%;
  font-size: 13px;
  cursor: pointer;
}

.commit-row:hover { background-color: var(--bg-light); }

.commit-row.is-selected {
  background-color: rgba(88, 166, 255, 0.15) !important;
  border-left: 2px solid var(--accent-blue);
}

.commit-row.is-mainline {
  background-color: rgba(46, 160, 67, 0.05);
}

.connector-line {
  position: absolute;
  right: 0;
  top: 18px;
  width: 40px;
  height: 1px;
  background-color: var(--border-color);
  opacity: 0.5;
  z-index: 0;
}

/* Column Definitions */
.col-tags { width: 220px; display: flex; align-items: center; padding: 0 10px; overflow: hidden; flex-shrink: 0; position: relative; }

.col-graph-viewport { 
  height: 100%; 
  overflow: hidden; 
  flex-shrink: 0; 
  position: relative;
}

.resizer-mini {
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
  z-index: 10;
  flex-shrink: 0;
  border-left: 1px solid rgba(255,255,255,0.05);
}

.resizer-mini:hover {
  background-color: var(--accent-blue);
}

.resizer-mini.is-placeholder {
  cursor: default;
}

.header-label {
  padding-left: 10px;
  line-height: 32px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.graph-inner {
  height: 100%;
  width: 100%;
}

.col-message { 
  flex: 1; 
  overflow: hidden; 
  display: flex; 
  align-items: center; 
  padding: 0 15px; 
  min-width: 0;
  flex-shrink: 1;
}

.col-author { 
  width: 120px; 
  color: var(--text-muted); 
  flex-shrink: 0; 
  font-size: 12px;
  border-left: 1px solid rgba(255,255,255,0.03);
  padding-left: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-date { 
  width: 150px; 
  color: var(--text-muted); 
  padding-right: 12px; 
  flex-shrink: 0; 
  font-size: 12px;
  border-left: 1px solid rgba(255,255,255,0.03);
  padding-left: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.graph-svg {
  height: 100%;
  display: block;
}

.graph-path {
  transition: opacity 0.2s;
  opacity: 0.6;
}

.commit-row:hover .graph-path {
  opacity: 1;
}

.graph-node-circle {
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
  transition: transform 0.1s ease-out;
  transform-origin: center;
  transform-box: fill-box;
}

.commit-row:hover .graph-node-circle {
  transform: scale(1.2);
}

.message-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  overflow: hidden;
}

.commit-tags {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.branch-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
  font-weight: 700;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.branch-tag .el-icon {
  font-size: 10px;
}

.node-text {
  pointer-events: none;
  user-select: none;
  fill: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  transition: transform 0.1s ease-out;
  transform-origin: center;
  transform-box: fill-box;
}

.commit-row:hover .node-text {
  transform: scale(1.2);
}

.commit-msg {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-main);
}

.head-tag {
  background-color: var(--accent-blue);
  color: white;
  padding: 0 6px;
  border-radius: 3px;
  font-size: 10px;
  margin-left: 8px;
  font-weight: bold;
}

/* Right Sidebar */
.right-sidebar { 
  background-color: var(--bg-dark); 
  border-left: 1px solid var(--border-color); 
  display: flex; 
  flex-direction: column; 
  flex-shrink: 0;
}

.panel-header { padding: 12px; font-size: 12px; font-weight: 700; color: var(--text-muted); border-bottom: 1px solid var(--border-color); }

.staging-panel { flex: 1; display: flex; flex-direction: column; }

.commit-area { padding: 15px; border-top: 1px solid var(--border-color); }

.dark-textarea .el-textarea__inner { background-color: var(--bg-darker); border-color: var(--border-color); color: var(--text-main); }

.commit-btn { width: 100%; margin-top: 12px; }

.commit-details { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

.details-header { display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid var(--border-color); }

.author-line { display: flex; align-items: center; gap: 10px; margin-top: 8px; }

.author-avatar { 
  width: 32px; height: 32px; border-radius: 4px; display: flex; align-items: center; 
  justify-content: center; color: white; font-weight: bold; font-size: 14px;
}

.author-meta { display: flex; flex-direction: column; gap: 2px; }
.author-meta strong { color: var(--text-main); font-size: 14px; }
.author-meta span { color: var(--text-muted); font-size: 12px; }

.parents-line {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.parents-line .label {
  color: var(--text-muted);
}

.parent-hashes {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.parent-hash-link {
  color: var(--accent-blue);
  cursor: pointer;
  background-color: rgba(88, 166, 255, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  transition: all 0.2s;
}

.parent-hash-link:hover {
  background-color: rgba(88, 166, 255, 0.2);
  text-decoration: underline;
}

.commit-message-full { 
  padding: 15px; font-size: 14px; line-height: 1.5; color: var(--text-main); 
  white-space: pre-wrap; background-color: var(--bg-darker); margin: 10px 15px; 
  border-radius: 4px; border: 1px solid var(--border-color);
}

.details-toolbar {
  padding: 10px 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid var(--border-color);
}



.file-count-row { 
  display: flex; 
  align-items: center; 
  gap: 6px; 
  font-size: 13px; 
  font-weight: 600; 
  color: var(--text-main);
}

.toolbar-actions-row { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; /* Spread actions to both ends */
  width: 100%;
}

.sort-action { 
  cursor: pointer; 
  color: var(--text-muted); 
  padding: 4px; 
  border-radius: 4px; 
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.mode-switch-group {
  background-color: var(--bg-darker);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  padding: 2px;
  flex-shrink: 0;
}

.mode-switch-btn {
  padding: 4px 12px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  user-select: none;
}

.mode-switch-btn.is-active {
  background-color: var(--accent-blue);
  color: white;
  font-weight: 600;
}

.mode-switch-btn:hover:not(.is-active) {
  background-color: var(--bg-light);
  color: var(--text-main);
}

.view-all-files {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.sort-action:hover { background-color: var(--bg-light); color: var(--text-main); }

.mode-btn { padding: 4px 8px; }

.files-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px 15px;
  position: relative;
}

.file-item-mini.is-active {
  background-color: rgba(88, 166, 255, 0.15);
  border-left: 2px solid var(--accent-blue);
}

/* Diff Split View */
.diff-split-view {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.diff-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--border-color);
}

.diff-side:last-child {
  border-right: none;
}

.diff-side-header {
  height: 28px;
  background-color: var(--bg-medium);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.diff-side-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  font-family: 'Cascadia Code', Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.5;
}

.diff-line {
  display: flex;
  min-height: 20px;
}

.diff-line .line-num {
  width: 50px;
  padding: 2px 8px;
  text-align: right;
  color: var(--text-muted);
  background-color: var(--bg-dark);
  border-right: 1px solid var(--border-color);
  flex-shrink: 0;
  user-select: none;
}

.diff-line .line-content {
  flex: 1;
  padding: 2px 8px;
  white-space: pre;
  overflow: visible;
}

.diff-line.removed {
  background-color: rgba(248, 81, 73, 0.15);
}

.diff-line.removed .line-content {
  background-color: rgba(248, 81, 73, 0.1);
}

.diff-line.added {
  background-color: rgba(46, 160, 67, 0.15);
}

.diff-line.added .line-content {
  background-color: rgba(46, 160, 67, 0.1);
}

.diff-line.hunk {
  background-color: var(--bg-medium);
}

.diff-line.hunk .line-content {
  color: var(--text-muted);
  font-style: italic;
}

.close-btn-container {
  display: flex;
  align-items: center;
}

.custom-close-btn {
  transition: all 0.2s ease;
}

.custom-close-btn:hover {
  background-color: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.diff-header {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-medium);
  flex-shrink: 0;
}

.diff-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-main);
  overflow: hidden;
}

.diff-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.diff-body {
  flex: 1;
  overflow: auto;
  padding: 10px;
}

.diff-pre {
  margin: 0;
  font-family: 'Cascadia Code', Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #d1d5da;
}

.file-item-mini { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  padding: 6px 8px; 
  font-size: 13px; 
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 2px;
}

.file-item-mini:hover {
  background-color: var(--bg-light);
}

.custom-tree-node.is-active {
  background-color: rgba(88, 166, 255, 0.15);
  border-left: 2px solid var(--accent-blue);
}

.file-status-icon { font-size: 14px; }

.dark-tree {
  background: transparent !important;
  color: var(--text-main) !important;
}

.dark-tree .el-tree-node__content:hover {
  background-color: var(--bg-light) !important;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.status-m, .status-M { color: #e6a23c; }
.status-a, .status-A { color: #67c23a; }
.status-d, .status-D { color: #f56c6c; }

/* Custom Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg-darker); }
::-webkit-scrollbar-thumb { background: var(--bg-light); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--bg-medium); }
</style>

