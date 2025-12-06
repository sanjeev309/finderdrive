import { Modal } from '../common/Modal';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileName: string;
    onDelete: () => void;
}

export function DeleteConfirmModal({ isOpen, onClose, fileName, onDelete }: DeleteConfirmModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Delete File?"
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="rounded px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-black/5 dark:hover:bg-white/10"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onDelete();
                            onClose();
                        }}
                        className="rounded bg-red-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-600"
                    >
                        Delete
                    </button>
                </>
            }
        >
            <p className="text-sm text-text-secondary">
                Are you sure you want to delete <span className="font-medium text-text-primary">"{fileName}"</span>? This action cannot be undone.
            </p>
        </Modal>
    );
}
