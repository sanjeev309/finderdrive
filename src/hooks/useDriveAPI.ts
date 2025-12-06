import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { listFiles, moveFile as moveFileAPI, renameFile as renameFileAPI, deleteFile as deleteFileAPI } from '../lib/drive';
import { getCachedFolder, setCachedFolder, invalidateFolder } from '../lib/db';
import type { Column } from '../types';

export function useDriveAPI() {
    const { auth, updateColumn, addColumn, removeColumnsAfter } = useAppStore();

    // Reusable fetcher with cache logic
    const fetchAndCache = useCallback(async (folderId: string, columnId: string) => {
        try {
            const startTime = Date.now();
            const files = await listFiles(folderId);

            updateColumn(columnId, {
                items: files,
                isLoading: false,
                loadTime: Date.now() - startTime,
            });

            // Update Cache
            setCachedFolder(folderId, files);
        } catch (error) {
            updateColumn(columnId, {
                isLoading: false,
                error: error as Error
            });
        }
    }, [updateColumn]);

    const loadFolder = useCallback(async (folderId: string, folderName: string) => {
        try {
            const newColumn: Column = {
                id: crypto.randomUUID(),
                folderId,
                folderName,
                items: [],
                selectedItemId: null,
                isLoading: true,
                loadTime: 0,
                error: null,
            };

            // 1. Try Cache
            const cachedFiles = await getCachedFolder(folderId);
            if (cachedFiles) {
                newColumn.items = cachedFiles;
                newColumn.isLoading = false;
            }

            // Return immediately with what we have
            // Wait, we can't return and then update if this is a helper.
            // But this function is seemingly unused? Replaced by openFolder. 
            // Keeping it consistent anyway.

            // 2. Background Fetch (SWR)
            fetchAndCache(folderId, newColumn.id);

            return newColumn;
        } catch (error) {
            console.error('Failed to load folder:', error);
            throw error;
        }
    }, [fetchAndCache]); // updateColumn is in fetchAndCache

    const openFolder = useCallback(async (folderId: string, folderName: string, columnIndex: number) => {
        // Remove all columns after the current one
        removeColumnsAfter(columnIndex);

        // Create placeholder column
        const columnId = crypto.randomUUID();
        const newColumn: Column = {
            id: columnId,
            folderId,
            folderName,
            items: [],
            selectedItemId: null,
            isLoading: true,
            loadTime: 0,
            error: null,
        };

        // 1. Try Cache
        const cachedFiles = await getCachedFolder(folderId);
        if (cachedFiles) {
            newColumn.items = cachedFiles;
            newColumn.isLoading = false;
        }

        addColumn(newColumn);

        // 2. Background Fetch (SWR)
        fetchAndCache(folderId, columnId);

    }, [removeColumnsAfter, addColumn, fetchAndCache]);

    // Initial Load of Root
    useEffect(() => {
        // Check DIRECTLY against store state to avoid closure staleness in Strict Mode
        const currentColumns = useAppStore.getState().columns;

        if (auth.isAuthenticated && currentColumns.length === 0) {
            const initInfo = { id: 'root', name: 'My Drive' };
            const columnId = crypto.randomUUID();

            const newColumn: Column = {
                id: columnId,
                folderId: initInfo.id,
                folderName: initInfo.name,
                items: [],
                selectedItemId: null,
                isLoading: true,
                loadTime: 0,
                error: null,
            };

            // Async wrapper to handle cache
            const init = async () => {
                const cachedFiles = await getCachedFolder(initInfo.id);
                if (cachedFiles) {
                    newColumn.items = cachedFiles;
                    newColumn.isLoading = false;
                }
                addColumn(newColumn);
                fetchAndCache(initInfo.id, columnId);
            };

            init();
        }
    }, [auth.isAuthenticated, addColumn, fetchAndCache]); // fetchAndCache stable

    const moveFile = useCallback(async (fileId: string, targetFolderId: string, sourceFolderId: string) => {
        try {
            await moveFileAPI(fileId, targetFolderId, sourceFolderId);

            // Invalidate Caches
            await invalidateFolder(sourceFolderId);
            await invalidateFolder(targetFolderId);

            // Optimistic update: Remove from source folder locally
            // We can't easily add to target folder if it's not open, but that's fine.
            const sourceCol = useAppStore.getState().columns.find(c => c.folderId === sourceFolderId);
            if (sourceCol) {
                const newItems = sourceCol.items.filter(i => i.id !== fileId);
                useAppStore.getState().refreshFolder(sourceFolderId, newItems);
                // Update cache with optimistic data?
                // Better to leave explicit setCachedFolder to fetch, but we can set it here too if we want perfect sync.
                // For now, invalidation is safer. 
            }

            // If target folder is open, refresh it
            // Ideally we'd just add it, but we need full file metadata that we might not have updated
            const targetCol = useAppStore.getState().columns.find(c => c.folderId === targetFolderId);
            if (targetCol) {
                // Trigger Fetch
                fetchAndCache(targetFolderId, targetCol.id);
            }

        } catch (error) {
            console.error("Move failed", error);
        }
    }, [fetchAndCache]);

    const renameFile = useCallback(async (fileId: string, newName: string) => {
        try {
            await renameFileAPI(fileId, newName);

            // Find file and update
            const columns = useAppStore.getState().columns;
            for (const col of columns) {
                const itemIndex = col.items.findIndex(i => i.id === fileId);
                if (itemIndex !== -1) {
                    const newItems = [...col.items];
                    newItems[itemIndex] = { ...newItems[itemIndex], name: newName };
                    useAppStore.getState().refreshFolder(col.folderId, newItems);

                    // Update cache manually since we have the data
                    await setCachedFolder(col.folderId, newItems);
                    break;
                }
            }
        } catch (error) {
            console.error("Rename failed", error);
        }
    }, []);

    const deleteFile = useCallback(async (fileId: string) => {
        try {
            await deleteFileAPI(fileId);

            // Remove from local
            const columns = useAppStore.getState().columns;
            for (const col of columns) {
                if (col.items.some(i => i.id === fileId)) {
                    const newItems = col.items.filter(i => i.id !== fileId);
                    useAppStore.getState().refreshFolder(col.folderId, newItems);

                    // Update cache
                    await setCachedFolder(col.folderId, newItems);
                    break;
                }
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    }, []);

    return { loadFolder, openFolder, moveFile, renameFile, deleteFile };
}
