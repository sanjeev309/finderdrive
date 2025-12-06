import { useState, useEffect } from 'react';
import { listFiles } from '../../lib/drive';
import type { DriveFile } from '../../types';
import { FileIcon } from '../finder/FileIcon';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (folderId: string) => void;
    files: File[];
}

export function UploadDestinationModal({ isOpen, onClose, onUpload, files }: Props) {
    if (!isOpen) return null;

    const [currentFolderId, setCurrentFolderId] = useState<string>('root');
    const [currentFolderName, setCurrentFolderName] = useState<string>('My Drive');
    const [items, setItems] = useState<DriveFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // History mainly for back navigation
    const [history, setHistory] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        loadItems(currentFolderId);
    }, [currentFolderId]);

    const loadItems = async (folderId: string) => {
        setIsLoading(true);
        try {
            const files = await listFiles(folderId);
            // Filter only folders for navigation
            const folders = files.filter(f => f.isFolder);
            setItems(folders);
        } catch (e) {
            console.error(e);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnterFolder = (folder: DriveFile) => {
        setHistory(prev => [...prev, { id: currentFolderId, name: currentFolderName }]);
        setCurrentFolderId(folder.id);
        setCurrentFolderName(folder.name);
    };

    const handleBack = () => {
        if (history.length === 0) return;
        const previous = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setCurrentFolderId(previous.id);
        setCurrentFolderName(previous.name);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-bg-secondary p-4 shadow-xl border border-border">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-primary">Select Destination</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="mb-4 text-sm text-text-secondary">
                    Uploading {files.length} file{files.length !== 1 ? 's' : ''} to:
                </div>

                <div className="mb-4 px-2 py-1 bg-bg-primary rounded border border-border flex items-center">
                    {history.length > 0 && (
                        <button onClick={handleBack} className="mr-2 p-1 hover:bg-black/5 rounded dark:hover:bg-white/10">
                            <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    )}
                    <span className="font-medium text-sm text-text-primary truncate">{currentFolderName}</span>
                </div>

                <div className="h-64 overflow-y-auto rounded border border-border bg-bg-primary">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-text-secondary">
                            No folders found
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {items.map(folder => (
                                <li key={folder.id}>
                                    <button
                                        onClick={() => handleEnterFolder(folder)}
                                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-left transition-colors"
                                    >
                                        <FileIcon file={folder} className="h-5 w-5" />
                                        <span className="truncate text-sm text-text-primary">{folder.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Cancel</button>
                    <button
                        onClick={() => onUpload(currentFolderId)}
                        className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
                    >
                        Upload Here
                    </button>
                </div>
            </div>
        </div>
    );
}
