// import { useAppStore } from '../store/appStore';
import { TopBar } from './layout/TopBar';
import { Sidebar } from './layout/Sidebar';
import { ColumnView } from './finder/ColumnView';

export function MainApp() {
    return (
        <div className="flex h-screen w-full flex-col bg-bg-primary text-text-primary">
            {/* Top Navigation */}
            <TopBar />

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <Sidebar />

                {/* Main Content Area (Column View) */}
                <main className="flex-1 overflow-hidden bg-bg-secondary relative">
                    <ColumnView />
                </main>
            </div>
        </div>
    );
}
