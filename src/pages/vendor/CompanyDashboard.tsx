import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '@/lib/api';
import { getVendorLogoUrl } from '@/lib/utils';
import {
    Building2,
    AlertTriangle,
    ArrowUpRight,
    Activity,
    Calendar,
    ChevronRight,
    Gauge,
    ShieldCheck,
    User,
} from 'lucide-react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import DashboardLoader from '@/lib/loader';

// --- TYPE DEFINITIONS ---
interface OutletContextType {
    user: {
        id: string;
        name: string;
        email?: string;
        role?: string;
        roles?: string[];
        bio?: string;
        vendor_type?: string;
    };
}

interface StatCardData {
    title: string;
    value: string;
    change: string;
    icon: React.ElementType;
}

interface QuickActionData {
    text: string;
    desc: string;
    icon: React.ElementType;
    path: string;
}

interface VendorProfile {
    id: string;
    business_name: string;
    address?: string;
    account_id?: string;
    paybill?: string;
    vendor_type?: string;
    bank_name?: string;
    status?: string;
    logo_url?: string | null;
    dashboard_settings?: { primary_color?: string; tagline?: string; show_logo_in_sidebar?: boolean };
    user?: { id: string; name: string; email: string; username?: string };
}

// --- CONSTANTS & HELPERS ---
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good Morning' };
    if (hour >= 12 && hour < 18) return { text: 'Good Afternoon' };
    return { text: 'Good Evening' };
};

const StatCard = ({ stat, index }: { stat: StatCardData; index: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all duration-300 group"
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">{stat.value}</h3>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-slate-400 dark:text-slate-500 transition-colors">
                <stat.icon size={24} />
            </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {stat.change}
        </div>
    </motion.div>
);

const CompanyDashboard: React.FC = () => {
    useOutletContext<OutletContextType>();
    const [profile, setProfile] = useState<VendorProfile | null>(null);
    const [stats, setStats] = useState<{ total_meters: number; active_meters: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    useEffect(() => {
        if (!token) return;
        const fetchProfile = async () => {
            try {
                const res = await api.get<{ status: number; vendor: VendorProfile; stats: { total_meters: number; active_meters: number } }>('/vendor/profile');
                if (res.data.status === 200) {
                    setProfile(res.data.vendor);
                    setStats(res.data.stats ?? { total_meters: 0, active_meters: 0 });
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load profile');
                setProfile(null);
                setStats({ total_meters: 0, active_meters: 0 });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [token]);

    const greeting = getGreeting();

    const vendorQuickActions: QuickActionData[] = [
        { text: 'Company Profile', desc: 'Account & billing', icon: Building2, path: '/dashboard/account' },
        { text: 'Managed Meters', desc: 'Units & pricing', icon: Gauge, path: '/dashboard/meters' },
        { text: 'System Config', desc: 'Integrations', icon: ShieldCheck, path: '/dashboard/system-config' },
        { text: 'Brand Assets', desc: 'Logo & themes', icon: User, path: '/dashboard/branding' },
    ];

    const vendorStats: StatCardData[] = stats
        ? [
            { title: 'Managed Meters', value: stats.total_meters.toString(), change: `${stats.active_meters} Active`, icon: Gauge },
            { title: 'Company', value: profile?.business_name || '—', change: 'Corporate Account', icon: Building2 },
            { title: 'Status', value: profile?.status === 'active' ? 'Active' : (profile?.status || '—'), change: 'Account', icon: Activity },
            { title: 'System', value: 'Normal', change: 'Operational', icon: Activity },
        ]
        : [];

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
                <DashboardLoader title="Loading Company Portal" subtitle="Fetching profile and corporate stats..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-slate-50 dark:bg-slate-950">
                <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 text-center max-w-md">
                    <AlertTriangle className="w-12 h-12 text-red-900 dark:text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-red-900 dark:text-red-500">Dashboard Error</h3>
                    <p className="text-red-700 dark:text-red-400 mt-2 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 md:p-8 font-sans text-slate-900 dark:text-slate-100 transition-colors">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                            {dayjs().format('dddd, D MMMM YYYY')}
                        </p>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                        {greeting.text}, <span className="text-[#0A1F44] dark:text-blue-400 capitalize">{profile?.business_name || 'Vendor'}</span>
                    </h1>
                    {(profile?.dashboard_settings?.tagline || profile?.business_name) && (
                        <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl text-sm font-medium opacity-80 italic">
                            {profile?.dashboard_settings?.tagline || `Welcome back to your corporate console.`}
                        </p>
                    )}
                </motion.div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                    Operational
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {vendorStats.map((stat, index) => (
                    <StatCard key={`${stat.title}-${index}`} stat={stat} index={index} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {vendorQuickActions.map((action, idx) => (
                            <Link key={`${action.text}-${idx}`} to={action.path}>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/30 dark:hover:border-blue-800 hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center gap-3"
                                >
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-900 dark:text-blue-400">
                                        <action.icon size={22} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{action.text}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{action.desc}</p>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Corporate actions</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Access company tools and manage your fleet of meters.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/dashboard/meters" className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm">
                                Manage Fleet <ArrowUpRight size={16} />
                            </Link>
                            <Link to="/dashboard/system-config" className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-2 border border-slate-100 dark:border-slate-700">
                                System Integrations <ArrowUpRight size={16} />
                            </Link>
                        </div>
                    </motion.div>
                </div>
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <h3 className="font-bold text-slate-900 dark:text-white">Corporate Entity</h3>
                            <Link to="/dashboard/account" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
                                Edit <ChevronRight className="w-3 h-3 ml-1" />
                            </Link>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                {profile?.logo_url ? (
                                    <img src={getVendorLogoUrl(profile.logo_url) || ''} alt="Logo" className="w-12 h-12 rounded-xl object-contain bg-slate-50 dark:bg-slate-800" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-blue-900 dark:bg-blue-800 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                        {(profile?.business_name || 'V').substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{profile?.business_name || '—'}</p>
                                    <p className="text-xs text-slate-500 font-medium">{profile?.vendor_type || 'Company'} • {profile?.bank_name || '—'}</p>
                                </div>
                            </div>
                            {profile?.address && <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{profile.address}</p>}
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#0A1F44] dark:bg-slate-900 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden border border-slate-700 dark:border-slate-800"
                    >
                        <div className="absolute top-0 right-0 opacity-10 transform translate-x-8 -translate-y-8">
                            <Building2 size={100} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-1">Fleet summary</h3>
                            <p className="text-blue-200 dark:text-blue-400/60 text-xs mb-6 font-medium">Corporate units</p>
                            <div className="flex justify-between items-center border-b border-blue-800/50 dark:border-slate-800/50 pb-2 text-sm">
                                <span className="text-blue-100 dark:text-slate-300 flex items-center gap-2">
                                    <Gauge size={16} /> Total Meters
                                </span>
                                <span className="font-bold">{stats?.total_meters ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 text-sm">
                                <span className="text-blue-100 dark:text-slate-300 flex items-center gap-2">
                                    <Activity size={16} /> Active
                                </span>
                                <span className="font-bold">{stats?.active_meters ?? 0}</span>
                            </div>
                            <Link to="/dashboard/meters" className="mt-6 w-full py-2.5 bg-white dark:bg-blue-600 text-blue-900 dark:text-white text-sm font-bold rounded-xl flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-500 transition-all shadow-sm">
                                View Fleet Details
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default CompanyDashboard;
