import { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';

interface RenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    onRename: (newName: string) => void;
}

export function RenameModal({ isOpen, onClose, currentName, onRename }: RenameModalProps) {
    const [name, setName] = useState(currentName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName(currentName);
            // Focus and select text after render
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 50);
        }
    }, [isOpen, currentName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (trimmed && trimmed !== currentName) {
            onRename(trimmed);
            onClose();
        } else if (trimmed === currentName) {
            onClose(); // No change
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Rename"
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
                        Rename
                    </button>
                </>
            }
        >
            <form onSubmit={handleSubmit}>
                <label htmlFor="filename" className="block text-sm font-medium text-text-secondary mb-2">
                    Enter a new name
                </label>
                <input
                    ref={inputRef}
                    id="filename"
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
