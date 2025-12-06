import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { listFiles, moveFile as moveFileAPI, renameFile as renameFileAPI, deleteFile as deleteFileAPI, searchFiles, getPath, uploadFile } from '../lib/drive';
import { getCachedFolder, setCachedFolder, invalidateFolder } from '../lib/db';
import type { Column, DriveFile } from '../types';

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
    const initialized = useRef(false);

    useEffect(() => {
        if (!auth.isAuthenticated) return;

        // Dedup check 1: Component-level ref
        if (initialized.current) return;

        // Dedup check 2: Store check & Cleanup
        const currentColumns = useAppStore.getState().columns;
        const rootColumns = currentColumns.filter(c => c.folderId === 'root');

        if (rootColumns.length > 1) {
            // Safe Reset: If multiple roots exist, clear 'em.
            useAppStore.getState().setColumns([]);
        } else if (currentColumns.length > 0) {
            // Already initialized validly
            initialized.current = true;
            return;
        }

        initialized.current = true;

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
    }, [auth.isAuthenticated, addColumn, fetchAndCache]);

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

    const searchDrive = useCallback(async (query: string) => {
        try {
            return await searchFiles(query);
        } catch (error) {
            console.error("Search failed", error);
            return [];
        }
    }, []);

    const openPath = useCallback(async (file: DriveFile) => {
        try {
            // 1. Get full path (ancestors + file)
            const path = await getPath(file.id);

            // 2. Filter out 'root' if it's the start, as we probably want to render it, 
            // but if it duplicates the existing root column?
            // The user said "as new column all the way from the root".
            // So we append Root -> A -> B... to the end.
            // We don't filter root.

            // 3. For each folder in the path, create a column
            // But wait, the LAST item is the file itself (if it's a file).
            // We should only create columns for folders.
            // If the last item is a file, we select it in the second-to-last column.



            // We start appending from the current end of columns
            // But `addColumn` adds one by one. `setColumns` replaces. 
            // We can use `addColumn` in a loop, but that triggers multiple renders.
            // Better to prepare state and update at once if possible, but store only has `addColumn`.
            // We should add `addColumns` to store? Or just call `addColumn` loop.
            // Loop is fine for now.

            const foldersToOpen = path.filter(f => f.isFolder);
            const targetIsFile = !file.isFolder;

            let parentId: string | null = null;

            for (const folder of foldersToOpen) {
                const columnId = crypto.randomUUID();
                const newColumn: Column = {
                    id: columnId,
                    folderId: folder.id,
                    folderName: folder.name,
                    items: [],
                    selectedItemId: null,
                    isLoading: true,
                    loadTime: 0,
                    error: null,
                };

                // Add to local list to execute logic, but we need to push to store to trigger fetch?
                // `fetchAndCache` needs the column to exist in store?
                // Yes, `updateColumn` updates by ID.

                // So we must Add then Fetch.
                addColumn(newColumn);
                fetchAndCache(folder.id, columnId);

                parentId = folder.id;
            }

            // If target was a file, we select it in the last added column
            if (targetIsFile && parentId) {
                // We need to wait for the fetch to finish? 
                // No, we can set selectedItemId immediately, even if items are empty.
                // Once items load, the UI highlights it.
                // But wait, we need to know the ID of the last column we just added.
                // We can't know easily unless we track it.
                // We just added it. It's the last one in store *after* updates?
                // React might batch.
                // Ideally `addColumn` could return the ID or we pass it. 
                // We generated `columnId` above.
                // We can use the last `columnId` generated in the loop.

                // Find the last column ID (it corresponds to the parent folder of the file)
                // The loop iterates `foldersToOpen`. The last one is the parent.
                // We only need to set `selectedItemId` on the column for `parentId`.
                // We can use `updateColumn` for this.

                // But `items` are not loaded yet. `updateColumn` merges.
                // We can set `selectedItemId: file.id`.

                // wait, we generated columnId in the loop. We need to capture the last one.
                // Let's refactor the loop slightly.
            }

        } catch (error) {
            console.error("Failed to open path", error);
        }
    }, [addColumn, fetchAndCache]);

    const uploadFiles = useCallback(async (files: File[], folderId: string) => {
        const { addUpload, updateUploadProgress, completeUpload, columns, refreshFolder } = useAppStore.getState();

        for (const file of files) {
            const uploadId = crypto.randomUUID();

            // 1. Add to Queue
            addUpload({
                id: uploadId,
                items: [file], // wrapper for now
                status: 'pending',
                progress: 0
            });

            // 2. Start Upload
            // Update to uploading
            useAppStore.getState().updateUploadProgress(uploadId, 0);

            try {
                // Actually calling the API
                const uploadedFile = await uploadFile(file, folderId, (progress) => {
                    updateUploadProgress(uploadId, progress);
                });

                completeUpload(uploadId, 'completed');

                // 3. Refresh Folder if visible
                // Check if any column is showing this folder
                const col = columns.find(c => c.folderId === folderId);
                if (col) {
                    // We append the new file to the existing items to avoid full reload
                    const newItems = [...col.items, uploadedFile];
                    refreshFolder(folderId, newItems);
                    // Update cache
                    setCachedFolder(folderId, newItems);
                }

            } catch (error) {
                console.error("Upload failed", error);
                completeUpload(uploadId, 'error');
            }
        }
    }, []);

    return { loadFolder, openFolder, moveFile, renameFile, deleteFile, searchDrive, openPath, uploadFiles };
}
