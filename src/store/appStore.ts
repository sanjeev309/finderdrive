import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Column, Theme, AuthState, DriveFile } from '../types';

interface UploadItem {
    id: string;
    items: File[];
    status: 'pending' | 'uploading' | 'completed' | 'error';
    progress: number;
}

interface AppState {
    // Auth
    auth: AuthState;
    setAuth: (auth: Partial<AuthState>) => void;
    logout: () => void;

    // Theme
    theme: Theme;
    setTheme: (mode: Theme['mode']) => void;

    // Columns & Navigation
    columns: Column[];
    setColumns: (columns: Column[]) => void;
    addColumn: (column: Column) => void;
    removeColumnsAfter: (index: number) => void;
    updateColumn: (id: string, updates: Partial<Column>) => void;

    // Selection
    selectedFileIds: Set<string>;
    selectFile: (id: string, multi: boolean) => void;
    deselectAll: () => void;

    // Mutual Exclusion for Drag & Drop
    activeDragId: string | null;
    setActiveDragId: (id: string | null) => void;

    // Actions
    refreshFolder: (folderId: string, files: DriveFile[]) => void;

    // Uploads
    uploadQueue: UploadItem[];
    addUpload: (item: UploadItem) => void;
    updateUploadProgress: (id: string, progress: number) => void;
    completeUpload: (id: string, status: 'completed' | 'error') => void;
    removeUpload: (id: string) => void;

    // Preview Pane
    showPreviewPane: boolean;
    togglePreviewPane: () => void;
    setShowPreviewPane: (show: boolean) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Auth Initial State
            auth: {
                isAuthenticated: !!localStorage.getItem('driveFS_auth'),
                user: JSON.parse(localStorage.getItem('driveFS_user') || 'null'),
                accessToken: JSON.parse(localStorage.getItem('driveFS_auth') || '{}').access_token,
                expiresAt: null,
            },
            setAuth: (auth) => set((state) => {
                const newAuth = { ...state.auth, ...auth };
                if (auth.accessToken) {
                    localStorage.setItem('driveFS_auth', JSON.stringify({ access_token: auth.accessToken }));
                }
                if (auth.user) {
                    localStorage.setItem('driveFS_user', JSON.stringify(auth.user));
                }
                return { auth: newAuth };
            }),
            logout: () => {
                localStorage.removeItem('driveFS_auth');
                localStorage.removeItem('driveFS_user');
                set({
                    auth: { isAuthenticated: false, user: null, accessToken: null, expiresAt: null },
                    columns: [],
                });
            },

            // Theme Initial State
            theme: { mode: 'light' },
            setTheme: (mode) => {
                localStorage.setItem('driveFS_theme', mode);
                set({ theme: { mode } });
            },

            // Columns Initial State
            columns: [],
            setColumns: (columns) => set({ columns }),
            addColumn: (column) => set((state) => ({ columns: [...state.columns, column] })),
            removeColumnsAfter: (index) => set((state) => ({
                columns: state.columns.slice(0, index + 1)
            })),
            updateColumn: (id, updates) => set((state) => ({
                columns: state.columns.map((col) =>
                    col.id === id ? { ...col, ...updates } : col
                )
            })),

            // Selection
            selectedFileIds: new Set<string>(),
            selectFile: (id, multi) => set((state) => {
                const newSet = multi ? new Set<string>(state.selectedFileIds) : new Set<string>();
                if (newSet.has(id)) {
                    newSet.delete(id);
                } else {
                    newSet.add(id);
                }
                return { selectedFileIds: newSet };
            }),
            deselectAll: () => set({ selectedFileIds: new Set<string>() }),

            // Drag & Drop
            activeDragId: null,
            setActiveDragId: (id) => set({ activeDragId: id }),

            // Actions
            refreshFolder: (folderId, files) => set((state) => ({
                columns: state.columns.map((col) =>
                    col.folderId === folderId ? { ...col, items: files } : col
                )
            })),

            // Upload Actions
            uploadQueue: [],
            addUpload: (item) => set((state) => ({ uploadQueue: [...state.uploadQueue, item] })),

            updateUploadProgress: (id, progress) => set((state) => ({
                uploadQueue: state.uploadQueue.map(u => u.id === id ? { ...u, progress } : u)
            })),

            completeUpload: (id, status) => set((state) => ({
                uploadQueue: state.uploadQueue.map(u => u.id === id ? { ...u, status, progress: status === 'completed' ? 100 : u.progress } : u)
            })),

            removeUpload: (id) => set((state) => ({
                uploadQueue: state.uploadQueue.filter(u => u.id !== id)
            })),

            showPreviewPane: true,
            togglePreviewPane: () => set((state) => ({ showPreviewPane: !state.showPreviewPane })),
            setShowPreviewPane: (show) => set({ showPreviewPane: show }),
        }),
        {
            name: 'finderdrive-storage',
            partialize: (state) => ({ theme: state.theme, showPreviewPane: state.showPreviewPane }), // Persist
            version: 1,
        }
    )
);
