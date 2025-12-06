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

// Export ensureClient as no-op to maintain compatibility if used elsewhere (though we should remove usages)
export const ensureClient = async () => { };
