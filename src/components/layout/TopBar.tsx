import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store/appStore';
import { useDriveAPI } from '../../hooks/useDriveAPI';
import type { DriveFile } from '../../types';
import { FileIcon } from '../finder/FileIcon';
import { UploadIndicator } from './UploadIndicator';
import { UploadDestinationModal } from '../upload/UploadDestinationModal';

// simple debounce utility
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export function TopBar() {
    const { auth, logout, columns, removeColumnsAfter } = useAppStore();
    const { searchDrive, openPath, uploadFiles } = useDriveAPI();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<DriveFile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Upload Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        async function performSearch() {
            if (debouncedQuery.trim().length === 0) {
                setResults([]);
                return;
            }

            setIsSearching(true);
            const files = await searchDrive(debouncedQuery);
            setResults(files);
            setIsSearching(false);
            setShowResults(true);
        }

        performSearch();
    }, [debouncedQuery, searchDrive]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleResultClick = (file: DriveFile) => {
        setShowResults(false);
        setQuery('');
        openPath(file);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            setPendingFiles(filesArray);
            setIsUploadModalOpen(true);

            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleConfirmUpload = (folderId: string) => {
        uploadFiles(pendingFiles, folderId);
        setIsUploadModalOpen(false);
        setPendingFiles([]);
    };

    return (
        <>
            <div className="flex h-16 items-center justify-between border-b border-border bg-bg-secondary px-4 shadow-sm relative z-20">
                {/* Left: Branding & Breadcrumbs */}
                <div className="flex items-center space-x-3 text-text-secondary">
                    <div className="flex items-center space-x-2 mr-4">
                        <img src="/logo.png" alt="FinderDrive" className="h-8 w-8 object-contain" />
                        <span className="text-xl font-semibold text-text-primary tracking-tight">FinderDrive</span>
                    </div>
                </div>

                {/* Breadcrumbs */}
                <div className="flex items-center overflow-x-auto scrollbar-hide mask-linear-fade">
                    {columns.map((col, index) => (
                        <div key={col.id} className="flex items-center flex-shrink-0 animate-fadeIn">
                            {index > 0 && (
                                <svg className="h-4 w-4 text-text-tertiary mx-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            <button
                                onClick={() => removeColumnsAfter(index)}
                                className={clsx(
                                    "px-2 py-1 rounded text-sm max-w-[150px] truncate transition-colors select-none",
                                    index === columns.length - 1
                                        ? "text-text-primary font-medium"
                                        : "text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10"
                                )}
                                title={col.folderName}
                            >
                                {col.folderName}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Center: Search */}
                <div className="mx-4 flex-1 max-w-xl relative" ref={wrapperRef}>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search in Drive..."
                            className="w-full rounded-lg border border-border bg-bg-primary pl-10 pr-4 py-2 text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if (e.target.value.trim()) setShowResults(true);
                            }}
                            onFocus={() => {
                                if (query.trim()) setShowResults(true);
                            }}
                        />
                        {isSearching && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg className="animate-spin h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Dropdown Results */}
                    {showResults && query.trim().length > 0 && (
                        <div className="absolute mt-1 w-full overflow-hidden rounded-md border border-border bg-bg-secondary shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-96 overflow-y-auto">
                            {results.length === 0 && !isSearching ? (
                                <div className="px-4 py-3 text-sm text-text-secondary">No results found.</div>
                            ) : (
                                <ul className="py-1">
                                    {results.map((file) => (
                                        <li
                                            key={file.id}
                                            className="cursor-pointer px-4 py-2 hover:bg-bg-primary flex items-center space-x-3 group"
                                            onClick={() => handleResultClick(file)}
                                        >
                                            <FileIcon file={file} className="h-5 w-5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate text-sm font-medium text-text-primary group-hover:text-accent">
                                                    {file.name}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Actions & Profile */}
                <div className="flex items-center space-x-3">
                    {/* Upload Button */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                    />
                    <button
                        onClick={handleUploadClick}
                        className="rounded-full p-2 text-text-secondary hover:bg-black/5 dark:hover:bg-white/10"
                        title="Upload Files"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </button>

                    {/* Preview Pane Toggle - REMOVED, moving to ColumnView */}

                    {/* Settings Button */}
                    <button className="rounded-full p-2 text-text-secondary hover:bg-black/5 dark:hover:bg-white/10">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>

                    {/* GitHub Link */}
                    <a
                        href="https://github.com/sanjeev309/finderdrive"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full p-2 text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        title="View on GitHub"
                    >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-1.033-.008-1.897-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                    </a>

                    {/* Profile / Logout */}
                    <div className="flex items-center space-x-2">
                        {auth.user?.photoLink && (
                            <img src={auth.user.photoLink} alt="Avatar" className="h-8 w-8 rounded-full" />
                        )}
                        <button
                            onClick={logout}
                            className="text-sm font-medium text-text-secondary hover:text-text-primary hover:underline"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
            <UploadIndicator />
            <UploadDestinationModal
                isOpen={isUploadModalOpen}
                onClose={() => {
                    setIsUploadModalOpen(false);
                    setPendingFiles([]);
                }}
                onUpload={handleConfirmUpload}
                files={pendingFiles}
            />
        </>
    );
}
