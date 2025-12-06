import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import type { DriveFile } from '../../types';
import { FileIcon } from './FileIcon';
import { useAppStore } from '../../store/appStore';

interface PreviewPaneProps {
    file: DriveFile | null;
}

export function PreviewPane({ file }: PreviewPaneProps) {
    const { togglePreviewPane } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);

    // Reset loading state when file changes
    useEffect(() => {
        setIsLoading(!!file);
    }, [file?.id]);

    if (!file) {
        return (
            <div className="flex h-full w-80 flex-shrink-0 flex-col items-center justify-center border-l border-border bg-bg-secondary p-6 text-center">
                <p className="text-sm text-text-secondary">Select a file to preview</p>
                <button
                    onClick={togglePreviewPane}
                    className="mt-4 text-xs text-text-secondary hover:text-text-primary underline"
                >
                    Close Preview
                </button>
            </div>
        );
    }

    const renderPreview = () => {
        // 1. Image
        if (file.mimeType.startsWith('image/')) {
            const previewUrl = file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+$/, '=s1000') : file.iconLink;
            return (
                <img
                    src={previewUrl}
                    alt={file.name}
                    className="max-h-64 object-contain shadow-sm rounded border border-border"
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                />
            );
        }

        // 2. Video
        if (file.mimeType.startsWith('video/')) {
            return (
                <div className="w-full aspect-video bg-black rounded overflow-hidden">
                    <iframe
                        src={`https://drive.google.com/file/d/${file.id}/preview`}
                        className="w-full h-full border-0"
                        allow="autoplay fullscreen"
                        onLoad={() => setIsLoading(false)}
                    />
                </div>
            );
        }

        // 3. Audio
        if (file.mimeType.startsWith('audio/')) {
            return (
                <div className="flex flex-col items-center justify-center w-full p-4 bg-bg-tertiary rounded-lg">
                    <FileIcon file={file} className="h-16 w-16 mb-4" />
                    <audio
                        controls
                        className="w-full"
                    >
                        <source src={`https://drive.google.com/uc?export=download&id=${file.id}`} type={file.mimeType} />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            );
        }

        // 4. Default / Icon
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <FileIcon file={file} className="h-32 w-32 shadow-lg mb-4" />
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

    return (
        <div className="flex h-full w-80 flex-shrink-0 flex-col border-l border-border bg-bg-secondary animate-fadeIn">
            {/* Header / Toggle */}
            <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border bg-bg-tertiary px-4">
                <span className="text-sm font-semibold text-text-primary">Preview</span>
                <button
                    onClick={togglePreviewPane}
                    className="rounded p-1 text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 hover:text-text-primary"
                    title="Collapse Preview"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Content SCROLLABLE area */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Visual Preview */}
                <div className="flex flex-col items-center justify-center min-h-[200px] mb-6 relative">
                    {isLoading && file.mimeType.startsWith('image/') && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
                        </div>
                    )}
                    {renderPreview()}
                </div>

                {/* Metadata */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-medium text-text-primary break-words text-center">{file.name}</h3>
                        <p className="text-xs text-text-secondary text-center mt-1">{file.mimeType}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-xs border-t border-border pt-4">
                        <span className="text-text-secondary pr-2 text-right">Size:</span>
                        <span className="text-text-primary">{formatSize(file.size)}</span>

                        <span className="text-text-secondary pr-2 text-right">Modified:</span>
                        <span className="text-text-primary">{new Date(file.modifiedTime).toLocaleDateString()} {new Date(file.modifiedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                        <span className="text-text-secondary pr-2 text-right">Created:</span>
                        {/* Drive file object often has createdTime but we didn't type it in DriveFile yet fully or strict? Accessing safe if exists, else fallback */}
                        <span className="text-text-primary">{(file as any).createdTime ? new Date((file as any).createdTime).toLocaleDateString() : '--'}</span>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex justify-center">
                        <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-2 rounded-full bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent/90 shadow-sm"
                        >
                            <span>Open in Drive</span>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
