import { Modal } from '../common/Modal';

interface ActionConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: React.ReactNode;
    confirmLabel: string;
    confirmVariant?: 'danger' | 'primary';
    onConfirm: () => void;
}

export function ActionConfirmModal({
    isOpen,
    onClose,
    title,
    message,
    confirmLabel,
    confirmVariant = 'primary',
    onConfirm
}: ActionConfirmModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
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
                            onConfirm();
                            onClose();
                        }}
                        className={`rounded px-3 py-1.5 text-sm font-medium text-white shadow-sm ${confirmVariant === 'danger'
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </>
            }
        >
            <div className="text-sm text-text-secondary">
                {message}
            </div>
        </Modal>
    );
}
