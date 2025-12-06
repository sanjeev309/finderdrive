import { clsx } from 'clsx';
import { useAppStore } from '../../store/appStore';

export function Sidebar() {
    const { theme } = useAppStore(); // Keeping theme for future use or just ignore lint line
    console.log(theme); // Usage to silence lint for now until theme implementation
    // Or just remove usage:
    // const {} = useAppStore();


    return (
        <aside className="w-56 flex-shrink-0 flex-col border-r border-border bg-bg-secondary pt-4">
            {/* Drives Section */}
            <div className="mb-6 px-3">
                <h2 className="mb-2 px-3 text-xs font-semibold uppercase text-text-secondary">Locations</h2>
                <div className="space-y-1">
                    <SidebarItem
                        icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                        label="My Drive"
                        isActive={true}
                        onClick={() => { }}
                    />
                    <SidebarItem
                        icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                        label="Shared with me"
                        isActive={false}
                        onClick={() => { }}
                    />
                    <SidebarItem
                        icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                        label="Trash"
                        isActive={false}
                        onClick={() => { }}
                    />
                </div>
            </div>

            {/* Tags / Favorites (Placeholder) */}
            <div className="px-3">
                <h2 className="mb-2 px-3 text-xs font-semibold uppercase text-text-secondary">Favorites</h2>
                <div className="px-3 py-4 text-center text-sm text-text-secondary">
                    No favorites yet
                </div>
            </div>
        </aside>
    );
}

function SidebarItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex w-full items-center space-x-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive
                    ? "bg-selection text-accent font-medium"
                    : "text-text-primary hover:bg-black/5 dark:hover:bg-white/5"
            )}
        >
            <span className={clsx("flex-shrink-0", isActive ? "text-accent" : "text-text-secondary")}>
                {icon}
            </span>
            <span>{label}</span>
        </button>
    );
}
