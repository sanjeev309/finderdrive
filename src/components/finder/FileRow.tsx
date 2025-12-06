import { clsx } from 'clsx';
import type { DriveFile } from '../../types';
import { FileIcon } from './FileIcon';

interface FileRowProps {
    file: DriveFile;
    isSelected?: boolean;
    onClick: (e: React.MouseEvent) => void;
    onDoubleClick: (e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    style?: React.CSSProperties; // For react-window compatibility
}

import { useRef, useEffect } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';

export function FileRow({ file, isSelected, onClick, onDoubleClick, onContextMenu, style }: FileRowProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: file.id,
        data: file
    });

    const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
        id: file.id,
        disabled: !file.isFolder,
        data: file
    });

    const elementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isSelected && elementRef.current) {
            elementRef.current.scrollIntoView({ block: 'nearest' });
        }
    }, [isSelected]);

    // Combine refs
    const setRefs = (node: HTMLElement | null) => {
        setNodeRef(node);
        setDroppableNodeRef(node);
        elementRef.current = node;
    };
    return (
        <div
            ref={setRefs}
            style={{
                ...style,
                transform: isDragging ? 'opacity(0.5)' : undefined,
            }}
            {...listeners}
            {...attributes}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
            className={clsx(
                "flex cursor-default items-center space-x-2 px-3 py-1.5 text-sm transition-colors select-none",
                isSelected
                    ? "bg-accent text-white"
                    : "text-text-primary hover:bg-black/5 dark:hover:bg-white/5",
                isOver && !isDragging && "bg-accent/20 ring-2 ring-accent inset-0"
            )}
            role="button"
            tabIndex={0}
        >
            {/* Icon */}
            <div className="flex-shrink-0">
                <FileIcon file={file} className="h-6 w-6" />
            </div>

            {/* Name */}
            <div className="flex-1 truncate">
                {file.name}
            </div>

            {/* Arrow for folders */}
            {file.isFolder && (
                <div className={clsx("flex-shrink-0 text-text-secondary", isSelected && "text-white/70")}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            )}
        </div>
    );
}
