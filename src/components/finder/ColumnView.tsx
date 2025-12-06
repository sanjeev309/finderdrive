import { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Column } from './Column';
import { useDriveAPI } from '../../hooks/useDriveAPI';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { FileRow } from './FileRow';
import { DriveFile } from '../../types';
import { ContextMenu } from '../common/ContextMenu';

export function ColumnView() {
    const { columns, activeDragId, setActiveDragId } = useAppStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { moveFile, renameFile, deleteFile } = useDriveAPI(); // Add rename/delete later to hook

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, file: DriveFile } | null>(null);

    // Initialize API (loads root)
    useDriveAPI();

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Scroll to right when columns change
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [columns.length]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
        setContextMenu(null); // Close menu on drag
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (!over) return;

        const fileId = active.id as string;
        const targetId = over.id as string;

        if (fileId !== targetId) {
            // Find the file being dragged to get its current parent
            // This is a bit expensive, could be optimized with a map
            let sourceFolderId = '';
            let draggedFile: DriveFile | undefined;

            for (const col of columns) {
                const found = col.items.find(f => f.id === fileId);
                if (found) {
                    sourceFolderId = col.folderId;
                    draggedFile = found;
                    break;
                }
            }

            // Determine if target is a folder (FileRow) or a Column (droppable container)
            // We'll need to handle target logic carefully.
            // Simplified: If target is a folder ID, move to it.
            if (sourceFolderId && draggedFile) {
                // Prevent moving into itself or immediate parent (redundant)
                if (targetId !== sourceFolderId && targetId !== fileId) {
                    console.log(`Moving ${fileId} to ${targetId}`);
                    await moveFile(fileId, targetId, sourceFolderId);
                }
            }
        }
    };

    const handleOpenContextMenu = (e: React.MouseEvent, file: DriveFile) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            file
        });
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    // Find active dragged item for overlay
    const activeItem = activeDragId
        ? columns.flatMap(c => c.items).find(i => i.id === activeDragId)
        : null;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div
                ref={scrollContainerRef}
                className="flex h-full w-full overflow-x-auto overflow-y-hidden bg-bg-secondary"
            >
                {columns.map((col, index) => (
                    <Column
                        key={col.id}
                        column={col}
                        index={index}
                        onOpenContextMenu={handleOpenContextMenu}
                    />
                ))}

                {/* Spacer or loading indicator */}
                {columns.length === 0 && (
                    <div className="flex h-full w-full items-center justify-center text-text-secondary">
                        Loading Drive...
                    </div>
                )}
            </div>

            {createPortal(
                <DragOverlay>
                    {activeItem ? (
                        <div className="opacity-80">
                            <FileRow
                                file={activeItem}
                                isSelected={false}
                                onClick={() => { }}
                                onDoubleClick={() => { }}
                                onContextMenu={() => { }}
                            />
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={handleCloseContextMenu}
                    options={[
                        {
                            label: 'Rename',
                            action: () => {
                                const newName = prompt("Enter new name:", contextMenu.file.name);
                                if (newName && newName !== contextMenu.file.name) {
                                    renameFile(contextMenu.file.id, newName);
                                }
                            }
                        },
                        {
                            label: 'Delete',
                            action: () => {
                                if (confirm(`Are you sure you want to delete "${contextMenu.file.name}"?`)) {
                                    deleteFile(contextMenu.file.id);
                                }
                            },
                            danger: true
                        },
                        { label: 'Get Info', action: () => window.open(contextMenu.file.webViewLink, '_blank') },
                    ]}
                />
            )}
        </DndContext>
    );
}
