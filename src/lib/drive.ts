import { DriveFile } from '../types';

/**
 * Helper to get the token and headers.
 * Throws if not authenticated.
 */
const getAuthHeaders = () => {
    const stored = localStorage.getItem('driveFS_auth');
    if (!stored) throw new Error("No auth token found");

    const { access_token } = JSON.parse(stored);
    return {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
    };
};

export const searchFiles = async (query: string): Promise<DriveFile[]> => {
    const headers = getAuthHeaders();

    // Sanitize query to prevent basic injection or errors
    const sanitizedQuery = query.replace(/'/g, "\\'");

    // Construct query parameters
    const params = new URLSearchParams({
        q: `name contains '${sanitizedQuery}' and trashed = false`,
        fields: 'files(id, name, mimeType, iconLink, thumbnailLink, modifiedTime, size, owners, webViewLink, parents)',
        orderBy: 'folder,name',
        pageSize: '20'
    });

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        method: 'GET',
        headers
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Drive API Error (searchFiles):", response.status, errorText);
        throw new Error(`Drive API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.files || []).map((file: unknown) => {
        const f = file as any;
        return {
            ...f,
            isFolder: f.mimeType === 'application/vnd.google-apps.folder'
        }
    }) as DriveFile[];
};

export const listFiles = async (folderId: string): Promise<DriveFile[]> => {
    const headers = getAuthHeaders();

    // Construct query parameters
    const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, iconLink, thumbnailLink, modifiedTime, size, owners, webViewLink, parents)',
        orderBy: 'folder,name',
        pageSize: '1000'
    });

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        method: 'GET',
        headers
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Drive API Error (listFiles):", response.status, errorText);
        throw new Error(`Drive API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.files || []).map((file: unknown) => {
        const f = file as any;
        return {
            ...f,
            isFolder: f.mimeType === 'application/vnd.google-apps.folder'
        }
    }) as DriveFile[];
};

export const getFile = async (fileId: string): Promise<DriveFile> => {
    const headers = getAuthHeaders();
    const params = new URLSearchParams({
        fields: 'id, name, mimeType, iconLink, thumbnailLink, modifiedTime, size, owners, webViewLink, parents'
    });

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?${params}`, {
        method: 'GET',
        headers
    });

    if (!response.ok) {
        throw new Error(`Drive API Error: ${response.statusText}`);
    }

    const file = await response.json();
    return {
        ...file,
        isFolder: file.mimeType === 'application/vnd.google-apps.folder'
    } as DriveFile;
};

// Deleting moves to trash
export const deleteFile = async (fileId: string): Promise<void> => {
    const headers = getAuthHeaders();

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ trashed: true })
    });

    if (!response.ok) {
        throw new Error(`Drive API Error: ${response.statusText}`);
    }
};

export const renameFile = async (fileId: string, newName: string): Promise<void> => {
    const headers = getAuthHeaders();

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name: newName })
    });

    if (!response.ok) {
        throw new Error(`Drive API Error: ${response.statusText}`);
    }
};

export const moveFile = async (fileId: string, newParentId: string, previousParentId?: string): Promise<void> => {
    const headers = getAuthHeaders();

    const url = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}`);
    url.searchParams.append('addParents', newParentId);
    if (previousParentId) {
        url.searchParams.append('removeParents', previousParentId);
    }

    const response = await fetch(url.toString(), {
        method: 'PATCH',
        headers
    });

    if (!response.ok) {
        throw new Error(`Drive API Error: ${response.statusText}`);
    }
};

export const getPath = async (fileId: string): Promise<DriveFile[]> => {
    const path: DriveFile[] = [];
    let currentId = fileId;
    let depth = 0;
    const maxDepth = 15;

    while (currentId && depth < maxDepth) {
        // If we hit the virtual root alias, stop. 
        // Note: The API usually returns 'root' as the ID for the root folder, 
        // or the actual ID. If it's a specific ID, we might not know it's root easily 
        // unless we check if it has no parents or parents include itself (unlikely).
        // Standard personal drive root has id 'root' alias usually working, 
        // but 'parents' field of files in root returns the actual long ID or 'isRoot' property?
        // Actually, files in root have a parent which is the root ID.
        // We can check if name is 'My Drive' or if we can't go higher.

        try {
            const file = await getFile(currentId);

            // Check if this file is the root (generic check)
            // Or if we should stop *at* this file (if it was the target passed in, we add it? 
            // The function implies getting path *to* the file? Or *of* the file?
            // "cascading down to the selected file" -> We need the folders *containing* the file.
            // So if I pass the file itself, I want its parents.

            // NOTE: The loop logic here:
            // We want the ancestors. 
            // If I start with 'fileId' (the target file), I should NOT add it to the folder path columns, 
            // unless it's a folder itself and we want to open it.
            // But the user said "cascading down to the selected file".
            // Implementation detail: The generic `getPath` should returns the chain including the file? 
            // Or just ancestors? 
            // Let's return the full chain including the file, and let the caller decide what to render.

            path.unshift(file);

            if (!file.parents || file.parents.length === 0) {
                break;
            }

            // Move up
            currentId = file.parents[0];

            // Optimization: If parent is explicitly 'root' (the alias), we might need to fetch it to get its name "My Drive"
            // But 'root' alias fetch works.

        } catch (e) {
            console.warn("Failed to resolve path for", currentId, e);
            break;
        }

        depth++;
    }

    return path;
};

// Export ensureClient as no-op to maintain compatibility if used elsewhere (though we should remove usages)
export const ensureClient = async () => { };
