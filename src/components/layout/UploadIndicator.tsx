import { useAppStore } from '../../store/appStore';

// Helper if clsx is not available
function clsx(...args: any[]) {
    return args
        .flat()
        .filter(x => typeof x === 'string' || (typeof x === 'object' && x !== null))
        .map(x => {
            if (typeof x === 'string') return x;
            return Object.keys(x).filter(k => x[k]).join(' ');
        })
        .join(' ');
}

export function UploadIndicator() {
    const { uploadQueue, removeUpload } = useAppStore();

    if (uploadQueue.length === 0) return null;

    const activeUploads = uploadQueue.filter(u => u.status === 'uploading' || u.status === 'pending');


    // Calculate total progress
    const totalProgress = activeUploads.length > 0
        ? activeUploads.reduce((acc, curr) => acc + curr.progress, 0) / activeUploads.length
        : 0;

    const isFinished = activeUploads.length === 0;

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-lg border border-border bg-bg-secondary shadow-lg dark:border-gray-700">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-gray-700">
                <h3 className="text-sm font-medium text-text-primary">
                    {isFinished ? 'Uploads Completed' : `Uploading ${activeUploads.length} files...`}
                </h3>
                {isFinished && (
                    <button
                        onClick={() => uploadQueue.forEach(u => removeUpload(u.id))}
                        className="text-xs text-text-secondary hover:text-text-primary"
                    >
                        Close
                    </button>
                )}
            </div>

            {!isFinished && (
                <div className="px-4 py-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                            className="h-full bg-accent transition-all duration-300 ease-out"
                            style={{ width: `${totalProgress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="max-h-60 overflow-y-auto px-4 py-2">
                {uploadQueue.map((item) => (
                    <div key={item.id} className="mb-2 flex items-center justify-between text-sm">
                        <span className="truncate text-text-secondary w-2/3" title={item.items[0]?.name}>
                            {item.items[0]?.name}
                        </span>
                        <span className={clsx("text-xs font-medium", {
                            "text-yellow-500": item.status === 'uploading' || item.status === 'pending',
                            "text-green-500": item.status === 'completed',
                            "text-red-500": item.status === 'error'
                        })}>
                            {item.status === 'uploading' ? `${Math.round(item.progress)}%` : item.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
