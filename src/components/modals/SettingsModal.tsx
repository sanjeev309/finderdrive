import { Modal } from '../common/Modal';
import { useAppStore } from '../../store/appStore';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { theme, setTheme, auth, logout } = useAppStore();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Settings"
            footer={
                <button
                    onClick={onClose}
                    className="rounded px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-black/5 dark:hover:bg-white/10"
                >
                    Close
                </button>
            }
        >
            <div className="space-y-6">
                {/* Appearance Section */}
                <section>
                    <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">Appearance</h3>

                    {/* Mode Toggle */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <button
                            onClick={() => setTheme({ mode: 'light' })}
                            className={`flex flex-col items-center space-y-2 p-3 rounded-lg border-2 transition-all ${theme.mode === 'light'
                                    ? 'border-accent bg-accent/5'
                                    : 'border-border hover:border-text-secondary'
                                }`}
                        >
                            <div className="w-full h-12 rounded bg-gray-100 border border-gray-300 shadow-sm flex items-center justify-center">
                                <span className="text-gray-800 text-xs font-medium">Light</span>
                            </div>
                            <span className={`text-xs font-medium ${theme.mode === 'light' ? 'text-accent' : 'text-text-secondary'}`}>Light</span>
                        </button>

                        <button
                            onClick={() => setTheme({ mode: 'dark' })}
                            className={`flex flex-col items-center space-y-2 p-3 rounded-lg border-2 transition-all ${theme.mode === 'dark'
                                    ? 'border-accent bg-accent/5'
                                    : 'border-border hover:border-text-secondary'
                                }`}
                        >
                            <div className="w-full h-12 rounded bg-gray-900 border border-gray-700 shadow-sm flex items-center justify-center">
                                <span className="text-white text-xs font-medium">Dark</span>
                            </div>
                            <span className={`text-xs font-medium ${theme.mode === 'dark' ? 'text-accent' : 'text-text-secondary'}`}>Dark</span>
                        </button>
                    </div>

                    {/* Accent Color Palette */}
                    <div className="mt-4 animate-fadeIn">
                        <label className="text-xs font-medium text-text-secondary mb-2 block">Accent Color</label>
                        <div className="flex items-center space-x-3">
                            {[
                                { name: 'Blue', color: '#3b82f6' },
                                { name: 'Purple', color: '#8b5cf6' },
                                { name: 'Green', color: '#22c55e' },
                                { name: 'Orange', color: '#f97316' },
                                { name: 'Pink', color: '#ec4899' },
                                { name: 'Red', color: '#ef4444' },
                            ].map((c) => (
                                <button
                                    key={c.color}
                                    onClick={() => setTheme({ accentColor: c.color })}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-secondary ${(theme.accentColor || '#3b82f6') === c.color ? 'border-text-primary scale-110' : 'border-transparent'
                                        }`}
                                    style={{ backgroundColor: c.color }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <div className="border-t border-border" />

                {/* Account Section */}
                <section>
                    <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">Account</h3>
                    <div className="flex items-center justify-between bg-bg-secondary p-3 rounded-lg border border-border">
                        <div className="flex items-center space-x-3">
                            {auth.user?.photoLink ? (
                                <img src={auth.user.photoLink} alt="Avatar" className="h-10 w-10 rounded-full" />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                                    {auth.user?.displayName?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-text-primary">{auth.user?.displayName}</p>
                                <p className="text-xs text-text-secondary">{auth.user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                onClose();
                            }}
                            className="text-xs font-medium text-red-500 hover:text-red-600 hover:underline px-2 py-1"
                        >
                            Sign Out
                        </button>
                    </div>
                </section>
            </div>
        </Modal>
    );
}
