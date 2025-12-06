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
import { ActionConfirmModal } from '../modals/ActionConfirmModal';
import { NewFolderModal } from '../modals/NewFolderModal';
import { PreviewPane } from './PreviewPane';

export function ColumnView() {
    const { columns, activeDragId, setActiveDragId, selectFile, updateColumn, showPreviewPane, togglePreviewPane, setShowPreviewPane } = useAppStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { moveFile, renameFile, deleteFile, openFolder, createFolder, copyFile } = useDriveAPI();

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
    const [modalState, setModalState] = useState<{
        type: 'rename' | 'delete' | 'move-confirm' | 'copy-confirm' | 'new-folder',
        file?: DriveFile,
        targetId?: string, // for move/copy
        sourceId?: string,  // for move
        folderId?: string // for new folder
    } | null>(null);

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
                    // await moveFile(fileId, targetId, sourceFolderId);
                    // Confirm Move
                    setModalState({
                        type: 'move-confirm',
                        file: draggedFile,
                        targetId: targetId,
                        sourceId: sourceFolderId
                    });
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
            <div className="flex h-full w-full overflow-hidden">
                <div
                    ref={scrollContainerRef}
                    className="flex flex-1 h-full overflow-x-auto overflow-y-hidden bg-bg-secondary"
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

                {/* Floating Preview Toggle (when pane is closed) */}
                {!showPreviewPane && columns.length > 0 && (
                    <button
                        onClick={togglePreviewPane}
                        className="absolute top-4 right-4 z-50 rounded-full p-2 bg-bg-tertiary/90 backdrop-blur-md border border-border text-text-secondary hover:text-text-primary hover:bg-bg-primary shadow-lg active:scale-95 transition-all"
                        title="Show Preview Pane"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                )}

                {/* Floating Preview Toggle (when pane is closed) */}


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
                                label: 'Preview',
                                action: () => setShowPreviewPane(true)
                            },
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
                            {
                                label: 'Copy',
                                action: () => {
                                    setModalState({ type: 'copy-confirm', file: contextMenu.file });
                                }
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
                    currentName={modalState?.file?.name || ''}
                    onRename={(newName) => {
                        if (modalState?.file) renameFile(modalState.file.id, newName);
                    }}
                />

                <ActionConfirmModal
                    isOpen={modalState?.type === 'delete'}
                    onClose={() => setModalState(null)}
                    title="Delete File?"
                    message={
                        <span>Are you sure you want to delete <span className="font-medium text-text-primary">"{modalState?.file?.name}"</span>? This action cannot be undone.</span>
                    }
                    confirmLabel="Delete"
                    confirmVariant="danger"
                    onConfirm={() => {
                        if (modalState?.file) deleteFile(modalState.file.id);
                    }}
                />

                <ActionConfirmModal
                    isOpen={modalState?.type === 'move-confirm'}
                    onClose={() => setModalState(null)}
                    title="Move Item?"
                    message={
                        <span>Are you sure you want to move <span className="font-medium text-text-primary">"{modalState?.file?.name}"</span>?</span>
                    }
                    confirmLabel="Move"
                    onConfirm={() => {
                        if (modalState?.file && modalState.targetId && modalState.sourceId) {
                            moveFile(modalState.file.id, modalState.targetId, modalState.sourceId);
                        }
                    }}
                />

                <ActionConfirmModal
                    isOpen={modalState?.type === 'copy-confirm'}
                    onClose={() => setModalState(null)}
                    title="Copy Item?"
                    message={
                        <span>Are you sure you want to copy <span className="font-medium text-text-primary">"{modalState?.file?.name}"</span>?</span>
                    }
                    confirmLabel="Copy"
                    onConfirm={() => {
                        if (modalState?.file) {
                            // Default to same folder (copy) logic if needed, or ask for target?
                            // Copy usually implies copying TO somewhere. But Finder "Duplicate" is same folder. "Copy" puts in clipboard.
                            // User requirement: "same for move and copy as well".
                            // Move is drag-drop. Copy is probably "Make a copy" in place?
                            // drive.ts copyFile takes parentId.
                            // If triggered from context menu on file, we probably duplicate it in same folder?
                            // Or we can assume we duplicate it in parent.
                            // We need to know parent. 'file' objects returned from API have 'parents'.
                            if (modalState.file.parents && modalState.file.parents.length > 0) {
                                copyFile(modalState.file.id, modalState.file.parents[0], `Copy of ${modalState.file.name}`);
                            }
                        }
                    }}
                />

                <NewFolderModal
                    isOpen={modalState?.type === 'new-folder'}
                    onClose={() => setModalState(null)}
                    onCreate={(name) => {
                        if (modalState?.type === 'new-folder') {
                            if (modalState.file) {
                                const col = columns.find(c => c.items.some(i => i.id === modalState.file!.id));
                                if (col) {
                                    createFolder(name, col.folderId);
                                }
                            } else if (modalState.folderId) {
                                createFolder(name, modalState.folderId);
                            }
                        }
                    }}
                />

                {columns.length > 0 && showPreviewPane && (
                    <PreviewPane file={
                        (() => {
                            const activeCol = columns[activeColIndex];
                            if (activeCol?.selectedItemId) {
                                return activeCol.items.find(i => i.id === activeCol.selectedItemId) || null;
                            }
                            return null;
                        })()
                    } />
                )}
            </div>
        </DndContext>
    );
}
