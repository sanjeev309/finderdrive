import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Column, Theme, AuthState } from '../types';

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
    refreshFolder: (folderId: string, files: any[]) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Auth Initial State
            auth: {
                isAuthenticated: false,
                user: null,
                accessToken: null,
                expiresAt: null,
            },
            setAuth: (updates) => set((state) => ({ auth: { ...state.auth, ...updates } })),
            logout: () => set({
                auth: { isAuthenticated: false, user: null, accessToken: null, expiresAt: null },
                columns: [], // Clear sensitive data
            }),

            // Theme Initial State
            theme: { mode: 'light' },
            setTheme: (mode) => set({ theme: { mode } }),

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
            selectedFileIds: new Set(),
            selectFile: (id, multi) => set((state) => {
                const newSet = new Set(multi ? state.selectedFileIds : []);
                if (newSet.has(id)) {
                    newSet.delete(id);
                } else {
                    newSet.add(id);
                }
                return { selectedFileIds: newSet };
            }),
            deselectAll: () => set({ selectedFileIds: new Set() }),

            // Drag & Drop
            activeDragId: null,
            setActiveDragId: (id) => set({ activeDragId: id }),

            // Actions
            refreshFolder: (folderId, files) => set((state) => ({
                columns: state.columns.map((col) =>
                    col.folderId === folderId ? { ...col, items: files } : col
                )
            })),
        }),
        {
            name: 'finderdrive-storage',
            partialize: (state) => ({ theme: state.theme }), // Only persist theme
            version: 1, // Invalidates old storage to clear potential bad state
        }
    )
);
