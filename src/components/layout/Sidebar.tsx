import { Link, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getVendorLogoUrl } from '@/lib/utils';

import { LayoutDashboard, LogOut, ArrowRight, Activity, Shield, User, Building2, Gauge, Users, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  profile_image: string | null;
  bio: string | null;
  roles?: string[];
  permissions?: string[];
  vendor_type?: string;
}

interface VendorProfile {
  logo_url?: string | null;
  business_name?: string;
  dashboard_settings?: { show_logo_in_sidebar?: boolean };
}

interface SidebarProps {
  user: UserProfile;
  vendorProfile?: VendorProfile | null;
  sidebarOpen: boolean;
  isMobile: boolean;
  onLogout: () => void;
  onCloseMobile: () => void;
}

const Sidebar = ({ user, vendorProfile, sidebarOpen, isMobile, onLogout, onCloseMobile }: SidebarProps) => {
  const location = useLocation();

  const isVendor = user.role === 'vendor' || user.roles?.includes('vendor');

  const getDashboardPath = () => {
    if (isVendor) {
      if (user.vendor_type === 'Company') return '/dashboard/company';
      if (user.vendor_type === 'Individual') return '/dashboard/individual';
    }
    return '/dashboard';
  };

  const allNavLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: getDashboardPath() },
    { name: 'Vending Control', icon: Activity, path: '/dashboard/vending-control' },
    { name: 'Roles & Permissions', icon: Shield, path: '/dashboard/roles-management' },
    { name: 'Vendor Management', icon: Building2, path: '/dashboard/vendors' },
    { name: 'Vendor Overview', icon: Users, path: '/dashboard/vendor-overview' },
    { name: 'Meter Management', icon: Gauge, path: '/dashboard/meters' },
    { name: 'Customer Overview', icon: Users, path: '/dashboard/customer-management' },
    { name: 'System Logs', icon: Activity, path: '/dashboard/auditlogs' },
    { name: 'System Configuration', icon: ShieldCheck, path: '/dashboard/system-config' },
    { name: 'Lipia Token na Mpesa', icon: Zap, path: '/dashboard/lipa-mpesa' },
    { name: 'Branding', icon: Building2, path: '/dashboard/branding' },
    { name: 'Account Settings', icon: User, path: '/dashboard/account' },
  ];
  const linkDisplayName = (link: (typeof allNavLinks)[0]) => {
    if (link.path === '/dashboard/meters' && isVendor) return 'My Meters';
    return link.name;
  };

  const sidebarNavLinks = allNavLinks.filter(link => {
    const isVendorUser = user.role === 'vendor' || user.roles?.includes('vendor');

    // Branding, System Configuration, and Customer Management are vendor-only
    if (['Branding', 'System Configuration', 'Customer Overview', 'Lipia Token na Mpesa'].includes(link.name) && !isVendorUser) {
      return false;
    }

    // Admin/SuperAdmin see everything (except the restricted items above)
    if (user.role === 'admin' || user.role === 'system_admin' || user.roles?.includes('admin')) {
      return true;
    }

    // Vendor specific view (Meter Management shown as "My Meters" via linkDisplayName)
    if (user.role === 'vendor' || user.roles?.includes('vendor')) {
      return ['Dashboard', 'Meter Management', 'Customer Overview', 'System Configuration', 'Account Settings', 'Branding', 'Lipia Token na Mpesa'].includes(link.name);
    }

    // Default: see everything (as safe fallback)
    return true;
  });

  const handleLogout = async () => {
    // Detect if dark mode is active on the root element
    const isDarkMode = document.documentElement.classList.contains('dark');

    const result = await Swal.fire({
      title: 'Ready to leave?',
      text: 'You are about to sign out of the admin panel.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: isDarkMode ? '#334155' : '#94a3b8',
      confirmButtonText: 'Sign Out',
      cancelButtonText: 'Stay',
      background: isDarkMode ? '#020617' : '#ffffff', // slate-950 or white
      color: isDarkMode ? '#f1f5f9' : '#1e293b',      // slate-100 or slate-800
      customClass: {
        popup: `rounded-3xl border ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} `,
        confirmButton: 'rounded-xl px-6',
        cancelButton: 'rounded-xl px-6'
      }
    });

    if (result.isConfirmed) {
      onLogout();
      Swal.fire({
        icon: 'success',
        title: 'Logged Out',
        text: 'Logged out successfully.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  // Framer Motion Variants
  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 88 },
    mobileOpen: { x: 0, width: 260 },
    mobileClosed: { x: "-100%", width: 260 }
  };

  const navItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05 }
    })
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={isMobile ? "mobileClosed" : (sidebarOpen ? "expanded" : "collapsed")}
        animate={isMobile ? (sidebarOpen ? "mobileOpen" : "mobileClosed") : (sidebarOpen ? "expanded" : "collapsed")}
        variants={sidebarVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="
          fixed md:relative z-50 h-full
          bg-white dark:bg-slate-950
          border-r border-slate-200 dark:border-slate-800
          flex flex-col shadow-2xl md:shadow-none
        "
      >
        <div className="h-6 w-full" />

        {/* Vendor logo in sidebar (when enabled) */}
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-4 space-y-2 custom-scrollbar">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider"
              >
                Main Menu
              </motion.div>
            )}
          </AnimatePresence>

          {sidebarNavLinks.map((link, i) => {
            const isActive = location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={isMobile ? onCloseMobile : undefined}
                className="block relative group"
              >
                <motion.div
                  custom={i}
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                  className={`
                    relative flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300
                    ${isActive
                      ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                    }
                    ${!sidebarOpen ? 'justify-center' : ''}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                    />
                  )}

                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative z-10"
                  >
                    <link.icon className={`w-[22px] h-[22px] transition-all duration-300 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'} `} />
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, display: 'none' }}
                        transition={{ duration: 0.2 }}
                        className="font-medium text-[15px] whitespace-nowrap flex-1 tracking-tight"
                      >
                        {linkDisplayName(link)}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {sidebarOpen && isActive && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-blue-400"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  )}

                  {!sidebarOpen && !isMobile && (
                    <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-2 group-hover:translate-x-0 shadow-xl z-50 whitespace-nowrap">
                      {linkDisplayName(link)}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-white" />
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50">
          <button
            onClick={handleLogout}
            className={`
              relative w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 group overflow-hidden hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 dark:hover:text-red-400
              ${!sidebarOpen ? 'justify-center' : ''}
            `}
          >
            <div className="relative z-10">
              <LogOut className="w-[22px] h-[22px] stroke-[1.5px] group-hover:stroke-[2px] transition-all" />
            </div>

            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium text-[15px] whitespace-nowrap z-10"
              >
                Log Out
              </motion.span>
            )}

            <div className="absolute inset-0 bg-red-50 dark:bg-red-900/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;