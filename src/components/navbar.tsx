import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu, Settings, LogOut,
  User as UserIcon, ChevronDown,
  ShieldCheck, Search, Plus, Bell, Activity
} from "lucide-react";
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { getVendorLogoUrl } from "@/lib/utils";

// Types
interface User {
  name: string;
  email: string;
  role?: string;
  roles?: string[];
}

interface VendorProfile {
  logo_url?: string | null;
  business_name?: string;
  dashboard_settings?: { show_logo_in_sidebar?: boolean; tagline?: string };
}

interface NavbarProps {
  user?: User | null;
  vendorProfile?: VendorProfile | null;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
  sidebarOpen?: boolean;
  onLogout?: () => void;
}

const Navbar = ({ user, vendorProfile, onToggleSidebar, showSidebarToggle = false, sidebarOpen, onLogout }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const location = useLocation();
  const profileRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.roles?.includes('admin') || (!user?.role && user); // Fallback for admin if role missing but user exists
  const isVendor = user?.role === 'vendor' || user?.roles?.includes('vendor');


  const NAV_HEIGHT_EXPANDED = 88;
  const NAV_HEIGHT_CONDENSED = 72;

  const handleLogout = async () => {
    const isDarkMode = document.documentElement.classList.contains('dark');

    const result = await Swal.fire({
      title: 'Ready to leave?',
      text: 'You are about to sign out of the system.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: isDarkMode ? '#334155' : '#94a3b8',
      confirmButtonText: 'Sign Out',
      cancelButtonText: 'Stay',
      background: isDarkMode ? '#020617' : '#ffffff',
      color: isDarkMode ? '#f1f5f9' : '#1e293b',
      customClass: {
        popup: `rounded-3xl border ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`,
        confirmButton: 'rounded-xl px-6',
        cancelButton: 'rounded-xl px-6'
      }
    });

    if (result.isConfirmed) {
      if (onLogout) onLogout();
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

  const handleScroll = useCallback(() => {
    setScrolled(window.pageYOffset > 20);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll]);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 transition-colors duration-300">
        <motion.nav
          initial={false}
          animate={{
            height: scrolled ? NAV_HEIGHT_CONDENSED : NAV_HEIGHT_EXPANDED,
          }}
          className={`
            relative border-b backdrop-blur-2xl transition-all duration-500
            ${scrolled
              ? "bg-white/80 dark:bg-slate-950/80 border-slate-200/60 dark:border-slate-800/60 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
              : "bg-white/40 dark:bg-slate-950/40 border-transparent"
            }
          `}
        >
          <div className="w-full px-4 md:px-8 h-full flex justify-between items-center">

            {/* Left: Sidebar Toggle + Logo */}
            <div className="flex items-center gap-4">
              {showSidebarToggle && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onToggleSidebar}
                  className="flex items-center justify-center w-11 h-11 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300/50 dark:hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-all group shadow-sm hover:shadow-md"
                  aria-label="Toggle sidebar"
                >
                  <Menu className={`h-5 w-5 transition-transform duration-500 ${sidebarOpen ? 'rotate-180' : 'group-hover:translate-x-0.5'}`} />
                </motion.button>
              )}

              <Link to="/dashboard" className="flex items-center gap-3.5 group">
                <div className="relative">
                  {user?.role === 'vendor' && vendorProfile?.logo_url ? (
                    <div className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-transform group-hover:scale-105 duration-300">
                      <img
                        src={getVendorLogoUrl(vendorProfile.logo_url) || ''}
                        alt={vendorProfile?.business_name || 'Vendor'}
                        className="h-7 w-7 rounded-md object-contain"
                      />
                    </div>
                  ) : (
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 shadow-sm transition-all group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30"
                    >
                      <ShieldCheck className="w-5 h-5 text-blue-900 dark:text-blue-400" />
                    </motion.div>
                  )}
                </div>
                <div className="flex flex-col">
                  {user?.role === 'vendor' ? (
                    <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {vendorProfile?.business_name || 'Vendor'}
                    </span>
                  ) : (
                    <div className="flex items-baseline gap-1.5 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {/* <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">TokenPaP</span> */}
                      <span className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400"> Tokenpap Utility Dashboard</span>
                    </div>
                  )}
                  <div className="mt-1 flex items-center">
                    {user?.role === 'vendor' && vendorProfile?.dashboard_settings?.tagline ? (
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {vendorProfile.dashboard_settings.tagline}
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold uppercase tracking-widest text-blue-800/60 dark:text-blue-400/60">
                        {user?.role || 'Admin'} Panel
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>

            {/* Middle: Enhanced Search (Desktop Only) */}
            {isAdmin && !isMobile && (
              <div className="flex-1 max-w-lg px-12 hidden lg:block">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    className={`
                      block w-full pl-11 pr-12 py-2.5 rounded-2xl
                      bg-slate-100/50 dark:bg-slate-900/50 border border-transparent
                      focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500/50
                      focus:ring-4 focus:ring-blue-500/10 transition-all duration-300
                      placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm font-medium
                    `}
                    placeholder="Search metrics, users, or settings..."
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-400 shadow-sm">
                      ⌘K
                    </kbd>
                  </div>
                </div>
              </div>
            )}

            {/* Right: Actions + Profile */}
            <div className="flex items-center gap-2 sm:gap-4">
              {isAdmin && !isMobile && (
                <>
                  {/* Quick Actions */}
                  <div className="flex items-center gap-1.5 mr-3 pr-3 border-r border-slate-200/60 dark:border-slate-800/60">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-900 transition-all shadow-sm hover:shadow-md border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50" 
                      title="Add New Meter"
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="relative p-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-900 transition-all shadow-sm hover:shadow-md border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50" 
                      title="System Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 shadow-sm animate-pulse"></span>
                    </motion.button>
                  </div>
                </>
              )}

              <ThemeToggle />

              {user ? (
                <div className="relative z-50" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`
                      flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all duration-300
                      ${isProfileOpen
                        ? 'bg-blue-50 border-blue-200 dark:bg-slate-800 dark:border-blue-900/50 ring-2 ring-blue-100 dark:ring-blue-900/20'
                        : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                      }
                    `}
                  >
                    <div className="relative">
                      {user?.role === 'vendor' && vendorProfile?.logo_url ? (
                        <img
                          src={getVendorLogoUrl(vendorProfile.logo_url) || ''}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                      ) : (
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0284c7&color=fff&bold=true`}
                          alt={user.name}
                          className="w-8 h-8 rounded-full shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                      )}
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                    </div>
                    <div className="hidden md:block text-left mr-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">{user.name}</p>
                      <p className="text-[10px] text-black dark:text-white font-bold normal tracking-wider mt-0.5">{user.role || "Admin"}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                      >
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="flex items-center gap-3 mb-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0284c7&color=fff&bold=true`}
                              className="w-10 h-10 rounded-xl"
                              alt=""
                            />
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                            </div>
                          </div>
                          <div className="px-3 py-1 rounded-lg bg-blue-100/50 dark:bg-blue-900/20 text-[10px] font-bold text-blue-700 dark:text-blue-300 w-fit uppercase tracking-widest">
                            {user.role || "System Admin"}
                          </div>
                        </div>
                        <div className="p-2">
                          {[
                            { icon: UserIcon, label: "My Profile", path: "/dashboard/manage-account", desc: "View your personal details" },
                            { icon: Activity, label: "Audit Logs", path: "/dashboard/audit-logs", desc: "System activity records", adminOnly: true },
                            { icon: Settings, label: "System Config", path: "/dashboard/system-config", desc: "Global system settings", vendorOnly: true },
                          ].filter(m => {
                            if (m.adminOnly && !isAdmin) return false;
                            if (m.vendorOnly && !isVendor) return false;
                            return true;
                          }).map((item) => (
                            <Link
                              key={item.label}
                              to={item.path}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
                            >
                              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors">
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-500 font-normal">{item.desc}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          >
                            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30">
                              <LogOut className="w-4 h-4" />
                            </div>
                            Sign out of Account
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login" className="px-5 py-2.5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 hover:bg-blue-700 dark:hover:bg-blue-600 transition-all">
                  Login
                </Link>
              )}
            </div>
          </div>
        </motion.nav>
      </header>

      {/* Spacer */}
      <div style={{ height: scrolled ? NAV_HEIGHT_CONDENSED : NAV_HEIGHT_EXPANDED }} />

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm z-40 md:hidden"
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;