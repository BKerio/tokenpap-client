import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { User, Smartphone, Mail, Hash, CreditCard, Activity } from 'lucide-react';

const CustomerDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="p-6 space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome back, {user?.name}!</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your utility account and view your meter status.</p>
                </div>
                <div className="bg-blue-600 px-4 py-2 rounded-xl text-white flex items-center gap-2 shadow-lg shadow-blue-500/20">
                    <Activity size={18} />
                    <span className="font-semibold">Account Active</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">My Profile</h3>
                            <p className="text-xs text-slate-400">Account Information</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail size={16} className="text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-300">{user?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Smartphone size={16} className="text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-300">{user?.phone || 'N/A'}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Meter Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                            <Hash size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Meter Details</h3>
                            <p className="text-xs text-slate-400">Connected Utility</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Number</span>
                            <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">#MET-8829-001</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Status</span>
                            <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 text-[10px] font-bold uppercase">Online</span>
                        </div>
                    </div>
                </motion.div>

                {/* Tokens Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Tokens</h3>
                            <p className="text-xs text-slate-400">Available Credit</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="text-center">
                            <span className="text-3xl font-bold text-slate-800 dark:text-white">124.50</span>
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Units Available</p>
                        </div>
                    </div>
                </motion.div>
            </div>
            
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Transactions</h2>
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Activity size={48} className="opacity-20 mb-4" />
                    <p>No recent transaction history found.</p>
                </div>
            </section>
        </div>
    );
};

export default CustomerDashboard;
