import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
// ... (I will use multi_replace for this to be safe)
import { cn } from '@/lib/utils';
import {
  Building,
  AlertTriangle,
  FileText,
  Building2,
  ArrowUpRight,
  Activity,
  QrCode,
  Calendar,
  ChevronRight,
  Gauge,
  ShieldCheck,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import DashboardLoader from '@/lib/loader';

// --- TYPE DEFINITIONS (ADDED) ---

interface OutletContextType {
  user: {
    id: string;
    name: string;
    email?: string;
    role?: string;
    roles?: string[];
    bio?: string;
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

interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  address: string;
  account_id: string;
  paybill: string;
  vendor_type: string;
  bank_name: string;
  status: string;
  created_at: string;
}

interface Meter {
  id: string;
  meter_number: string;
  status: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// --- CONSTANTS & HELPERS ---

const BLUE_PALETTE = [
  '#0A1F44', // Dark Blue
  '#2563eb', // Blue-600
  '#3b82f6', // Blue-500
  '#60a5fa', // Blue-400
  '#93c5fd', // Blue-300
  '#cbd5e1', // Slate-300
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Good Morning' };
  if (hour >= 12 && hour < 18) return { text: 'Good Afternoon' };
  return { text: 'Good Evening' };
};


// --- SUB-COMPONENTS ---

// 1. Stat Card
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

// 2. Custom Tooltip for Chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 dark:border-slate-600">
        <p className="font-bold mb-1">{payload[0].name}</p>
        <p className="text-blue-200">{payload[0].value} {payload[0].name === "Total" ? "Vendors" : ""}</p>
      </div>
    );
  }
  return null;
};

// --- MAIN COMPONENT ---

const Dashboard: React.FC = () => {
  const { user } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'vendor' || user?.roles?.includes('vendor')) {
      const vendorType = (user as any).vendor_type;
      if (vendorType === 'Individual') {
        navigate('/dashboard/individual', { replace: true });
      } else {
        navigate('/dashboard/company', { replace: true });
      }
    }
  }, [user, navigate]);

  // State
  const [stats, setStats] = useState<StatCardData[] | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const quickActions: QuickActionData[] = [
    { text: 'Add Vendor', desc: 'Create account', icon: Building2, path: '/dashboard/vendors' },
    { text: 'Meters', desc: 'Manage units', icon: Gauge, path: '/dashboard/meters' },
    { text: 'Account', desc: 'System settings', icon: ShieldCheck, path: '/dashboard/account' },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [vendorsRes, metersRes] = await Promise.all([
          api.get<PaginatedResponse<Vendor>>(`/admin/vendors?per_page=1000`),
          api.get<PaginatedResponse<Meter>>(`/admin/meters?per_page=1000`),
        ]);

        const vData = vendorsRes.data.data || [];
        const mData = metersRes.data.data || [];

        const activeVendors = vData.filter((v: Vendor) => v.status === 'active').length;
        const totalMeters = mData.length;

        setStats([
          { title: 'Total Vendors', value: vData.length.toString(), change: `${activeVendors} Active Accounts`, icon: Building2 },
          { title: 'Total Meters', value: totalMeters.toString(), change: 'Registered Devices', icon: Gauge },
          { title: 'System Load', value: 'Normal', change: 'Operational Status', icon: Activity },
        ]);

        setVendors(vData);
        setMeters(mData);

      } catch (err) {
        setError("Unable to sync dashboard data.");
        console.error('Dashboard fetch error:', err);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };

    fetchDashboardData();
  }, [API_URL]);

  const vendorTypeData = Object.entries(
    vendors.reduce((acc, curr) => {
      const t = curr.vendor_type || 'Unknown';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Early return for loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <DashboardLoader
          title="Syncing Dashboard"
          subtitle="Gathering metrics, structure data..."
        />
      </div>
    );
  }

  // Guard clause for missing user
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-slate-50 dark:bg-slate-950">
        <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-900 dark:text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 dark:text-red-500">Authentication Error</h3>
          <p className="text-red-700 dark:text-red-400 mt-2 text-sm">User data not available. Please log in again.</p>
        </div>
      </div>
    );
  }

  const greeting = getGreeting();

  // Attendance Staff View
  if (user.roles?.includes('attendance_staff')) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 md:p-8 font-sans text-slate-900 dark:text-slate-100 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">

              <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {dayjs().format('dddd, D MMMM YYYY')}
              </p>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {greeting.text}, <span className="text-blue-900 dark:text-blue-400">{user.name || 'User'}</span>
            </h1>
          </motion.div>
        </div>
      </div>
    );
  }


  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-900 dark:text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 dark:text-red-500">Dashboard Error</h3>
          <p className="text-red-700 dark:text-red-400 mt-2 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 md:p-8 font-sans text-slate-900 dark:text-slate-100 transition-colors">

      {/* 1. Header / Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 text-sm">
              <Calendar size={16} /> {dayjs().format('dddd, D MMMM YYYY')}
            </p>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {greeting.text}, <span className="text-blue-900 dark:text-blue-400">{user.name || 'Admin'}</span>
          </h1>
          {user.bio && (
            <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl italic text-sm">
              &ldquo;{user.bio}&rdquo;
            </p>
          )}
        </motion.div>

        <div className="flex flex-col items-end gap-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm text-xs font-medium text-slate-600 dark:text-slate-400"
          >
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            System Operational
          </motion.div>

          {user.roles && user.roles.length > 0 && (
            <div className="flex gap-2 flex-wrap justify-end">
              {user.roles.map(role => (
                <span key={role} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold rounded-md tracking-wider border border-blue-100 dark:border-blue-800">
                  {role.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats?.map((stat, index) => (
          <StatCard key={`${stat.title}-${index}`} stat={stat} index={index} />
        ))}
      </div>

      {/* 3. Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-8">

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <Link key={`${action.text}-${idx}`} to={action.path}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/30 hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center gap-3"
                >
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-900 dark:text-blue-400 group-hover:bg-blue-900 dark:group-hover:bg-blue-700 group-hover:text-white transition-colors">
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
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Vendor Distribution</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Breakdown by business category</p>
              </div>
              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <ArrowUpRight className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </button>
            </div>

            <div className="h-[300px] w-full">
              {vendorTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vendorTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {vendorTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-slate-600 dark:text-slate-400 text-xs font-medium ml-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  No vendor data available
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-8">

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="font-bold text-slate-900 dark:text-white">Recent Vendors</h3>
              <Link to="/dashboard/vendors" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
                View All <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[350px] overflow-y-auto">
              {vendors.slice(0, 7).map((v) => (
                <div key={v.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-900 dark:bg-blue-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {v.business_name?.substring(0, 2).toUpperCase() || 'NA'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{v.business_name || 'Unnamed Vendor'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 truncate">{v.vendor_type || 'Unknown'} • {v.bank_name || 'No Bank'}</p>
                  </div>
                  <div className={cn("w-1.5 h-1.5 rounded-full", v.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500')}></div>
                </div>
              ))}
              {vendors.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No vendors registered yet
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0A1F44] dark:bg-slate-900 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden border border-slate-700 dark:border-slate-800"
          >
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-8 -translate-y-8">
              <Building size={150} />
            </div>

            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1">Network Status</h3>
              <p className="text-blue-200 dark:text-blue-400/60 text-xs mb-6 font-medium">Overview of registered entities</p>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-blue-800/50 dark:border-slate-800/50 pb-2 text-sm">
                  <span className="text-blue-100 dark:text-slate-300 flex items-center gap-2">
                    <Building2 size={16} /> Total Vendors
                  </span>
                  <span className="font-bold">{vendors.length}</span>
                </div>
                <div className="flex justify-between items-center border-b border-blue-800/50 dark:border-slate-800/50 pb-2 text-sm">
                  <span className="text-blue-100 dark:text-slate-300 flex items-center gap-2">
                    <Gauge size={16} /> Active Meters
                  </span>
                  <span className="font-bold">{meters.filter(m => m.status === 'active').length}</span>
                </div>
              </div>

              <Link to="/dashboard/vendors" className="mt-6 w-full py-2.5 bg-white dark:bg-blue-600 text-blue-900 dark:text-white text-sm font-bold rounded-xl flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-500 transition-all shadow-sm">
                Review Fleet
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;