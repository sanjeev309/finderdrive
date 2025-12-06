import { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';

interface NewFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (folderName: string) => void;
}

export function NewFolderModal({ isOpen, onClose, onCreate }: NewFolderModalProps) {
    const [name, setName] = useState("Untitled Folder");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName("Untitled Folder");
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 50);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (trimmed) {
            onCreate(trimmed);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="New Folder"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-black/5 dark:hover:bg-white/10"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-accent/90 disabled:opacity-50"
                    >
                        Create
                    </button>
                </>
            }
        >
            <form onSubmit={handleSubmit}>
                <label htmlFor="foldername" className="block text-sm font-medium text-text-secondary mb-2">
                    Folder Name
                </label>
                <input
                    ref={inputRef}
                    id="foldername"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    autoComplete="off"
                />
            </form>
        </Modal>
    );
}
