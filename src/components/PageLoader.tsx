import React, { useEffect, useState} from 'react';

const PageLoader: React.FC = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 10;
            });
        }, 100);

        return () => {
            clearInterval(interval);
            setProgress(100);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-sv-surface/80 backdrop-blur-md transition-opacity duration-300">
            {/* Top Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-sv-surface-muted">
                <div
                    className="h-full bg-sv-info transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Central Spinner & Branding */}
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-sv-info-soft border-t-sv-info animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-black text-sv-info uppercase tracking-tighter">WA</span>
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-sm font-black text-sv-text-primary uppercase tracking-widest mb-1">In Transit</h2>
                    <p className="text-[10px] text-sv-text-muted font-bold uppercase tracking-tight">Synchronizing secure governance modules...</p>
                </div>
            </div>
        </div>
    );
};

export default PageLoader;
