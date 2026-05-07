import { useEffect, useState } from 'react';
import { FiAlertOctagon, FiCpu, FiShield } from 'react-icons/fi';
import { adminService } from '../api/admin.service';

export default function GovernanceBanner() {
    const [status, setStatus] = useState<{ isDegraded: boolean; mode: string } | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await adminService.getGovernanceStatus();
                if (res.data) setStatus(res.data);
            } catch {
                // Silently fail, don't break the UI
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!status?.isDegraded) return null;

    return (
        <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
                <FiAlertOctagon className="text-xl" />
                <div className="text-xs">
                    <p className="font-black uppercase tracking-widest">Fail-Secure: Read-Only Mode Active</p>
                    <p className="opacity-80 font-medium">Sentinel Gateway has detected infrastructure instability. Registry mutations are temporarily restricted.</p>
                </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
                <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black flex items-center gap-2">
                    <FiCpu /> {status.mode}
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black flex items-center gap-2">
                    <FiShield /> APEX-GUARDED
                </div>
            </div>
        </div>
    );
}
