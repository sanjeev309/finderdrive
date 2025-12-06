import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DriveFile } from '../../types';
import { FileIcon } from '../finder/FileIcon';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: DriveFile | null;
}

export function PreviewModal({ isOpen, onClose, file }: PreviewModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Reset loading state when file changes
    useEffect(() => {
        setIsLoading(true);
    }, [file?.id]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !file) return null;

    const renderContent = () => {
        // 1. Image
        if (file.mimeType.startsWith('image/')) {
            // Use thumbnailLink usually, but for high res we might need to fetch blob or use webContentLink?
            // thumbnailLink often has size params like =s220. We can try stripping it or using a larger size.
            // But Drive API often restricts direct linking without auth cookies for full content.
            // We'll try thumbnailLink=s1000 for "preview" quality.
            const previewUrl = file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+$/, '=s1000') : file.iconLink;

            return (
                <div className="flex h-full w-full items-center justify-center p-4">
                    <img
                        src={previewUrl}
                        alt={file.name}
                        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                    />
                </div>
            );
        }

        // 2. Video
        if (file.mimeType.startsWith('video/')) {
            // Video playback requires auth usually. iframe with webViewLink might work but often shows "Preview invalid" or full UI.
            // Embed link: webViewLink often previews.
            // Let's try iframe.
            // Note: embedding google drive preview often has X-Frame-Options or requires signed in browser.
            // Since we are OAuthed, explicit 'embed' url might work `https://drive.google.com/file/d/${file.id}/preview`
            return (
                <div className="h-full w-full bg-black">
                    <iframe
                        src={`https://drive.google.com/file/d/${file.id}/preview`}
                        className="h-full w-full border-0"
                        allow="autoplay fullscreen"
                        onLoad={() => setIsLoading(false)}
                    />
                </div>
            );
        }

        // 3. Audio
        if (file.mimeType.startsWith('audio/')) {
            return (
                <div className="flex h-full w-full flex-col items-center justify-center bg-bg-secondary p-8">
                    <FileIcon file={file} className="h-32 w-32 mb-8" />
                    <audio
                        controls
                        className="w-full max-w-md"
                    // Src is tricky without direct download link with auth. 
                    // Often we need to fetch blob and create object URL.
                    // For now, let's try a direct link (might fail without cookies).
                    // Fallback: iframe preview
                    >
                        <source src={`https://drive.google.com/uc?export=download&id=${file.id}`} type={file.mimeType} />
                        Your browser does not support the audio element.
                    </audio>
                    <div className="mt-4 text-sm text-text-secondary">
                        (Audio playback may require direct auth cookies)
                    </div>
                </div>
            );
        }

        // 4. PDF / Default Iframe
        if (file.mimeType === 'application/pdf' || file.mimeType.includes('text') || file.mimeType.includes('document')) {
            return (
                <div className="h-full w-full bg-white">
                    <iframe
                        src={`https://drive.google.com/file/d/${file.id}/preview`}
                        className="h-full w-full border-0"
                        title={file.name}
                        onLoad={() => setIsLoading(false)}
                    />
                </div>
            );
        }

        // Fallback: Type icon and info
        return (
            <div className="flex h-full w-full flex-col items-center justify-center bg-bg-secondary p-8">
                <FileIcon file={file} className="h-32 w-32 shadow-lg mb-6" />
                <p className="text-lg font-medium text-text-primary">{file.name}</p>
                <p className="text-sm text-text-secondary mt-2">{file.mimeType}</p>
                <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 rounded-full bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent/90"
                >
                    Open in Drive
                </a>
            </div>
        );
    };

    const formatSize = (bytes?: string) => {
        if (!bytes) return '--';
        const b = parseInt(bytes, 10);
        if (b < 1024) return b + ' B';
        const k = b / 1024;
        if (k < 1024) return k.toFixed(1) + ' KB';
        const m = k / 1024;
        if (m < 1024) return m.toFixed(1) + ' MB';
        return (m / 1024).toFixed(1) + ' GB';
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                ref={modalRef}
                className="relative z-10 flex h-full max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/10 bg-bg-secondary/95 shadow-2xl animate-scaleIn ring-1 ring-black/20"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header / Title Bar */}
                <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-white/10 bg-bg-tertiary/50 px-4 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 overflow-hidden">
                        <FileIcon file={file} className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate text-sm font-medium text-text-primary">{file.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-xs text-text-secondary hidden sm:inline-block">
                            {formatSize(file.size)} • {new Date(file.modifiedTime).toLocaleDateString()}
                        </span>
                        <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-1 text-text-secondary hover:bg-white/10 hover:text-text-primary"
                            title="Open in Drive"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                        <button onClick={onClose} className="rounded-full bg-white/10 p-1 text-text-secondary hover:bg-white/20 hover:text-text-primary">
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="relative flex-1 bg-black/5 dark:bg-black/40 overflow-hidden flex items-center justify-center">
                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
                        </div>
                    )}

                    {renderContent()}
                </div>
            </div>
        </div>,
        document.body
    );
}
