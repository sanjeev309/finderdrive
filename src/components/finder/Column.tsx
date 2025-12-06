import { useState } from 'react';
import type { Column as ColumnType, DriveFile } from '../../types';
import { FileRow } from './FileRow';
import { useAppStore } from '../../store/appStore';
import { useDriveAPI } from '../../hooks/useDriveAPI';
import { ContextMenu } from '../common/ContextMenu';

interface ColumnProps {
    column: ColumnType;
    index: number;
    isActive?: boolean;
    onActivate?: () => void;
    onOpenContextMenu: (e: React.MouseEvent, file: DriveFile) => void;
}

import { useDroppable } from '@dnd-kit/core';
import { clsx } from 'clsx';

export function Column({ column, index, isActive, onActivate, onOpenContextMenu }: ColumnProps) {
    const { selectFile, updateColumn } = useAppStore();
    const { openFolder } = useDriveAPI();
    const [headerMenu, setHeaderMenu] = useState<{ x: number; y: number } | null>(null);

    const handleHeaderMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setHeaderMenu({ x: e.clientX, y: e.clientY });
    };

    // Make the empty space in the column droppable (targets this folder)
    const { setNodeRef, isOver } = useDroppable({
        id: column.folderId,
        data: { isFolder: true, id: column.folderId } // Mimic file data structure for handler
    });

    const handleFileClick = (file: DriveFile) => {
        onActivate?.(); // Ensure activation
        selectFile(file.id, false);
        updateColumn(column.id, { selectedItemId: file.id });

        if (file.mimeType === 'application/vnd.google-apps.folder') {
            openFolder(file.id, file.name, index);
        }
    };

    const handleFileDoubleClick = (file: DriveFile) => {
        if (file.mimeType !== 'application/vnd.google-apps.folder') {
            window.open(file.webViewLink, '_blank');
        }
    };

    return (
        <div
            className={clsx(
                "flex h-full w-[250px] flex-col border-r border-border bg-bg-secondary flex-shrink-0 animate-slideInRight transition-colors",
                isActive ? "bg-bg-primary/50" : "opacity-90 hover:opacity-100"
            )}
            onClick={() => onActivate?.()}
            data-index={index}
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs font-medium text-text-secondary">
                <span className="truncate flex-1" title={column.folderName}>{column.folderName} ({column.items.length})</span>
                <button
                    onClick={handleHeaderMenuClick}
                    className="ml-2 rounded p-0.5 hover:bg-bg-tertiary focus:outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {column.isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent"></div>
                    </div>
                ) : column.error ? (
                    <div className="p-4 text-center text-sm text-red-500">
                        Error loading folder
                    </div>
                ) : (
                    <div
                        ref={setNodeRef}
                        className={clsx(
                            "h-full w-full overflow-y-auto scrollbar-hide",
                            isOver && "bg-accent/5"
                        )}
                    >
                        {/* Native List Rendering for Stability */}
                        {column.items.map((file) => (
                            <FileRow
                                key={file.id}
                                file={file}
                                isSelected={column.selectedItemId === file.id}
                                onClick={() => handleFileClick(file)}
                                onDoubleClick={() => handleFileDoubleClick(file)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    onOpenContextMenu(e, file);
                                }}
                            />
                        ))}
                        {column.items.length === 0 && (
                            <div className="p-4 text-center text-xs text-text-secondary">
                                Empty folder
                            </div>
                        )}
                    </div>
                )}
            </div>
            {headerMenu && (
                <ContextMenu
                    x={headerMenu.x}
                    y={headerMenu.y}
                    onClose={() => setHeaderMenu(null)}
                    options={[
                        {
                            label: 'Open in Google Drive',
                            action: () => {
                                window.open(`https://drive.google.com/drive/folders/${column.folderId}`, '_blank');
                            }
                        }
                    ]}
                />
            )}
        </div>
    );
}
