import type { Column as ColumnType, DriveFile } from '../../types';
import { FileRow } from './FileRow';
import { useAppStore } from '../../store/appStore';
import { useDriveAPI } from '../../hooks/useDriveAPI';

interface ColumnProps {
    column: ColumnType;
    index: number;
    onOpenContextMenu: (e: React.MouseEvent, file: DriveFile) => void;
}

import { useDroppable } from '@dnd-kit/core';
import { clsx } from 'clsx';

export function Column({ column, index, onOpenContextMenu }: ColumnProps) {
    const { selectFile, updateColumn } = useAppStore();
    const { openFolder } = useDriveAPI();

    // Make the empty space in the column droppable (targets this folder)
    const { setNodeRef, isOver } = useDroppable({
        id: column.folderId,
        data: { isFolder: true, id: column.folderId } // Mimic file data structure for handler
    });

    const handleFileClick = (file: DriveFile) => {
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
        <div className="flex h-full w-[250px] flex-col border-r border-border bg-bg-secondary flex-shrink-0 animate-slideInRight" data-index={index}>
            {/* Header */}
            <div className="border-b border-border px-3 py-2 text-xs font-medium text-text-secondary truncate">
                {column.folderName} ({column.items.length})
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
        </div>
    );
}
