import { getAuthUrl } from '../lib/auth';

export function LandingPage() {
    const handleLogin = () => {
        window.location.href = getAuthUrl();
    };

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-bg-primary text-text-primary">
            <h1 className="mb-4 text-4xl font-bold">FinderDrive</h1>
            <p className="mb-8 text-text-secondary">Google Drive with macOS Finder columns.</p>

            <button
                onClick={handleLogin}
                className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover"
            >
                Connect Google Drive
            </button>
        </div>
    );
}
