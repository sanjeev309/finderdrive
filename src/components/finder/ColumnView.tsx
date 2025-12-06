import { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Column } from './Column';
import { useDriveAPI } from '../../hooks/useDriveAPI';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { FileRow } from './FileRow';
import { DriveFile } from '../../types';
import { ContextMenu } from '../common/ContextMenu';
import { RenameModal } from '../modals/RenameModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { NewFolderModal } from '../modals/NewFolderModal';

export function ColumnView() {
    const { columns, activeDragId, setActiveDragId, selectFile, updateColumn } = useAppStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { moveFile, renameFile, deleteFile, openFolder, createFolder } = useDriveAPI();

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

    const [activeColIndex, setActiveColIndex] = useState(0);
    const prevColumnsLength = useRef(columns.length);

    // Modal State
    // Extended to support target folder ID directly for header actions (optional refactor later)
    const [modalState, setModalState] = useState<{ type: 'rename' | 'delete', file: DriveFile } | { type: 'new-folder', file?: DriveFile, folderId?: string } | null>(null);

    // Sync Active Column
    useEffect(() => {
        if (columns.length > prevColumnsLength.current) {
            setActiveColIndex(columns.length - 1);
        } else if (activeColIndex >= columns.length) {
            setActiveColIndex(Math.max(0, columns.length - 1));
        }
        prevColumnsLength.current = columns.length;
    }, [columns.length, activeColIndex]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (columns.length === 0) return;
            // Ignore if input is focused
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            const activeColumn = columns[activeColIndex];
            if (!activeColumn) return;

            const items = activeColumn.items;
            const currentIndex = items.findIndex(i => i.id === activeColumn.selectedItemId);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const targetIndex = currentIndex === -1 ? 0 : Math.min(items.length - 1, currentIndex + 1);
                if (items[targetIndex]) {
                    const item = items[targetIndex];
                    selectFile(item.id, false);
                    updateColumn(activeColumn.id, { selectedItemId: item.id });

                    // Add scrolling logic here or in FileRow via effect?
                    // Ideally we assume the view updates.
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const targetIndex = currentIndex === -1 ? items.length - 1 : Math.max(0, currentIndex - 1);
                if (items[targetIndex]) {
                    const item = items[targetIndex];
                    selectFile(item.id, false);
                    updateColumn(activeColumn.id, { selectedItemId: item.id });
                }
            } else if (e.key === 'Enter') {
                // Rename active item
                if (activeColumn.selectedItemId) {
                    const item = items.find(i => i.id === activeColumn.selectedItemId);
                    if (item) setModalState({ type: 'rename', file: item });
                }
            }
            else if (e.key === 'Delete' || e.key === 'Backspace') {
                // Delete active item (avoid Backspace for nav if we implement that? Finder cmd+backspace is delete. keeping simple for now)
                // Actually Backspace is often navigating back. Drive uses Delete.
                if (e.key === 'Delete' && activeColumn.selectedItemId) {
                    const item = items.find(i => i.id === activeColumn.selectedItemId);
                    if (item) setModalState({ type: 'delete', file: item });
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (currentIndex !== -1) {
                    const item = items[currentIndex];
                    if (item.mimeType === 'application/vnd.google-apps.folder') {
                        const nextCol = columns[activeColIndex + 1];
                        if (nextCol && nextCol.folderId === item.id) {
                            setActiveColIndex(activeColIndex + 1);
                        } else {
                            // If we call openFolder, it might take a moment.
                            // We shouldn't change index until column exists? 
                            // Actually openFolder is async but updates store synchronously with placeholder.
                            openFolder(item.id, item.name, activeColIndex);
                            // The effect above will detect length change and set index to last.
                        }
                    } else {
                        // Maybe focus next column if it exists?
                        // Finder usually doesn't focus "preview" unless it's a thing.
                    }
                }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (activeColIndex > 0) {
                    setActiveColIndex(activeColIndex - 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [columns, activeColIndex, selectFile, updateColumn, openFolder]);

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
                        isActive={index === activeColIndex}
                        onActivate={() => setActiveColIndex(index)}
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
                                setModalState({ type: 'rename', file: contextMenu.file });
                            }
                        },
                        {
                            label: 'Delete',
                            action: () => {
                                setModalState({ type: 'delete', file: contextMenu.file });
                            },
                            danger: true
                        },
                        { label: 'Get Info', action: () => window.open(contextMenu.file.webViewLink, '_blank') },
                        {
                            label: 'New Folder',
                            action: () => setModalState({ type: 'new-folder', file: contextMenu.file })
                        }
                    ]}
                />
            )}

            {/* Modals */}
            <RenameModal
                isOpen={modalState?.type === 'rename'}
                onClose={() => setModalState(null)}
                currentName={modalState?.file.name || ''}
                onRename={(newName) => {
                    if (modalState?.file) renameFile(modalState.file.id, newName);
                }}
            />

            <DeleteConfirmModal
                isOpen={modalState?.type === 'delete'}
                onClose={() => setModalState(null)}
                fileName={modalState?.file.name || ''}
                onDelete={() => {
                    if (modalState?.file) deleteFile(modalState.file.id);
                }}
            />

            <NewFolderModal
                isOpen={modalState?.type === 'new-folder'}
                onClose={() => setModalState(null)}
                onCreate={(name) => {
                    if (modalState?.file) { // contextMenu.file here is essentially the trigger or we need parentId?
                        // Issue: contextMenu.file might be a file inside the folder, or the folder itself?
                        // If we right clicked *on a file*, we usually want to create in the *current column* (folder).
                        // If we right click on blank space? We don't have that yet (header menu only).
                        // The header context menu passes the *folder* of the column.
                        // But we also have item context menu.
                        // Let's assume we use the Header Context Menu for "New Folder".
                        // Wait, Column.tsx has Header Menu. ColumnView.tsx has Item Context Menu.

                        // We need to differentiate or allow new folder from item menu (creating in same dir).
                        // Let's assume for now we want to support it. 
                        // If we are passed a file, usage implies "in the same folder as this file".

                        // BUT: contextMenu state in ColumnView stores `file: DriveFile`.
                        // We need to know the *parent* ID.
                        // If we right clicked a file, its parent is the column's folderId.
                        // We can find the column that contains this file.

                        // Optimization: Store columnId or folderId in contextMenu state? 
                        // Or just look it up.
                        const col = columns.find(c => c.items.some(i => i.id === modalState.file.id));
                        if (col) {
                            createFolder(name, col.folderId);
                        }
                    } else if (modalState?.folderId) {
                        // Fallback if we add support for passing generic folderId
                        createFolder(name, modalState.folderId);
                    }
                }}
            />
        </DndContext>
    );
}
