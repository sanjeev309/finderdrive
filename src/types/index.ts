export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    isFolder: boolean;
    iconLink: string;
    thumbnailLink?: string;
    modifiedTime: string;
    size?: string; // API returns string for size
    owners?: Array<{ displayName: string; emailAddress: string }>;
    permissions?: unknown[]; // Type strictly if needed
    webViewLink: string;
    parents?: string[];
}

export interface Column {
    id: string;
    folderId: string;
    folderName: string;
    items: DriveFile[];
    selectedItemId: string | null;
    isLoading: boolean;
    loadTime: number;
    error: Error | null;
    scrollTop?: number; // For virtualization restore
}

export interface Theme {
    mode: 'light' | 'dark';
    accentColor?: string;
    customAccentColor?: string; // keeping for backward compat during migration? No, let's use accentColor.
}

export interface AuthState {
    isAuthenticated: boolean;
    user: {
        displayName: string;
        email: string;
        photoLink: string;
    } | null;
    accessToken: string | null;
    expiresAt: number | null;
}
