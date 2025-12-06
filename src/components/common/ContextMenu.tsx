import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuProps {
    x: number;
    y: number;
    options: {
        label: string;
        action: () => void;
        danger?: boolean;
    }[];
    onClose: () => void;
}

export function ContextMenu({ x, y, options, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Initial positioning to prevent overflow (simplistic)
    const style = {
        top: y,
        left: x,
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-50 min-w-[160px] flex-col rounded-lg border border-border bg-bg-secondary py-1 shadow-lg animate-fadeIn"
            style={style}
        >
            {options.map((option, index) => (
                <button
                    key={index}
                    onClick={() => {
                        option.action();
                        onClose();
                    }}
                    className={`flex w-full px-4 py-2 text-left text-sm hover:bg-bg-primary ${option.danger ? 'text-red-500' : 'text-text-primary'
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>,
        document.body
    );
}
