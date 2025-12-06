import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string; // For width/height customizations
}

export function Modal({ isOpen, onClose, title, children, footer, className }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // Prevent body scroll
        }

        return () => {
            window.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Close on click outside
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
                onClick={handleBackdropClick}
            />

            {/* Modal Content */}
            <div
                ref={modalRef}
                className={clsx(
                    "relative z-10 flex flex-col w-full max-w-md overflow-hidden rounded-xl border border-white/20 bg-bg-secondary shadow-2xl animate-scaleIn ring-1 ring-black/10",
                    className
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h3 id="modal-title" className="text-sm font-semibold text-text-primary">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 text-text-primary">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-2 border-t border-border bg-bg-tertiary/50 px-4 py-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
