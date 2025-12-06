# FinderDrive - Project Plan

**Based on Specification v1.0**
**Current Focus:** Phase 1 (MVP) - Column View & File Operations

---

## Phase 1: MVP (Core Functionality)

### 1. Project Setup & Authentication
- [ ] **Repository Initialization**
  - [x] Vite + React + TypeScript setup
  - [x] Tailwind CSS configuration
  - [x] Basic directory structure
- [ ] **Authentication (OAuth 2.0)**
  - [ ] `AuthProvider` context implementation
  - [ ] Google Drive API (`gapi`) initialization
  - [ ] Login/Logout flow
  - [ ] Token storage & refresh logic (localStorage)

### 2. Column View Navigation (CURRENT FOCUS)
- [ ] **Core Components**
  - [ ] `ColumnView` container (horizontal scroll)
  - [ ] `Column` component (virtualized list via `react-window`)
  - [ ] `FileRow` component (icon, name, status)
- [ ] **Navigation Logic**
  - [ ] Folder clicking -> Append new column
  - [ ] Breadcrumb updates
  - [ ] "Active" state management (selection preservation)
  - [ ] Keyboard navigation support (Arrow keys)

### 3. File Operations & Drag-and-Drop
- [ ] **Drag & Drop (@dnd-kit)**
  - [ ] Draggable files/folders
  - [ ] Droppable folders/columns
  - [ ] Validation logic (prevent invalid moves)
- [ ] **Context Menu**
  - [ ] Right-click menu implementation
  - [ ] Actions: Open, Rename, Delete, Get Info
- [ ] **Mutations**
  - [ ] `renameFile` API integration
  - [ ] `trashFile` API integration
  - [ ] `moveFile` API integration
  - [ ] Conflict resolution modal (Duplicate names)

### 4. Caching & Persistence
- [ ] **IndexedDB Layer**
  - [ ] Schema setup (`folders`, `thumbnails`, `metadata`)
  - [ ] `CacheManager` class (LRU eviction logic)
  - [ ] Integration with file fetching hooks
- [ ] **Settings & Themes**
  - [ ] Theme toggler (Light/Dark/Custom)
  - [ ] Settings modal

---

## Phase 2: Enhanced Features

### 5. Search & Upload
- [ ] **Global Search**
  - [ ] Search bar in TopBar
  - [ ] Type-to-search interaction
- [ ] **File Upload**
  - [ ] Upload button & drop zone
  - [ ] Progress indicators
  - [ ] Multipart upload support

### 6. Advanced Operations
- [ ] **Selection**
  - [ ] Multi-select (Cmd/Shift + Click)
  - [ ] Batch operations (Delete/Move multiple)
- [ ] **Preview**
  - [ ] Preview pane implementation (Quick Look)

---

## Phase 3: Deployment & Polish

### 7. Deployment (Firebase Hosting)
- [ ] **Configuration**
  - [ ] `firebase.json` setup
  - [ ] GitHub Actions workflow for auto-deploy
- [ ] **Optimization**
  - [ ] Code splitting verification
  - [ ] Bundle analysis

### 8. Launch Prep
- [ ] **Testing**
  - [ ] Unit tests for utilities
  - [ ] End-to-end flows
- [ ] **Analytics**
  - [ ] Plausible analytics setup (Privacy focused)
