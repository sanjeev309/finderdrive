import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
    const [style, setStyle] = useState({ top: y, left: x, opacity: 0 });

    useLayoutEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            let newTop = y;
            let newLeft = x;

            // Check bottom edge
            if (y + rect.height > window.innerHeight) {
                newTop = y - rect.height;
            }

            // Check right edge
            if (x + rect.width > window.innerWidth) {
                newLeft = x - rect.width;
            }

            setStyle({ top: newTop, left: newLeft, opacity: 1 });
        }
    }, [x, y]);

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
            className="fixed z-50 min-w-[160px] flex-col rounded-lg border border-border bg-bg-secondary py-1 shadow-lg"
            style={{ top: style.top, left: style.left, opacity: style.opacity }}
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
