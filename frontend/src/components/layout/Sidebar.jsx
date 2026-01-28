/**
 * @file Sidebar.jsx
 * @description Advanced Navigation Sidebar Component.
 * Features:
 * - Responsive Collapsible Drawer (Mobile) vs Mini-Sidebar (Desktop)
 * - Framer Motion Layout Animations (Active Tab Indicators)
 * - Accessibility (Aria Labels, Keyboard Navigation)
 * - User Profile Footer with Quick Actions
 * - Intelligent Tooltips on collapse
 * * @component
 */

import React, { useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  FiHome, FiBox, FiActivity, FiPieChart, FiSettings, 
  FiLogOut, FiLayers, FiChevronLeft, FiUser, FiHelpCircle, FiGrid
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURATION ---
const SIDEBAR_WIDTH_EXPANDED = 'w-72';
const SIDEBAR_WIDTH_COLLAPSED = 'w-20';
const ANIMATION_DURATION = 0.3;

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Define Menu Structure
  const menuGroups = useMemo(() => [
    {
      label: "Main",
      items: [
        { path: '/dashboard', label: t('nav_dashboard'), icon: FiHome, shortcut: 'D' },
        { path: '/inventory', label: t('nav_inventory'), icon: FiBox, shortcut: 'I' },
      ]
    },
    {
      label: "Intelligence",
      items: [
        { path: '/analytics', label: t('nav_analytics'), icon: FiActivity, shortcut: 'A', badge: 'New' },
        { path: '/reports', label: t('nav_reports'), icon: FiPieChart, shortcut: 'R' },
      ]
    },
    {
      label: "System",
      items: [
        { path: '/settings', label: t('nav_settings'), icon: FiSettings, shortcut: 'S' },
      ]
    }
  ], [t]);

  // --- SUB COMPONENTS ---

  /**
   * @component NavItem
   * @description Individual Link Component with animation logic
   */
  const NavItem = ({ item }) => {
    const isActive = location.pathname.startsWith(item.path);

    return (
      <NavLink
        to={item.path}
        className={`
          relative flex items-center gap-4 px-3.5 py-3.5 rounded-xl transition-all duration-200 group outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900
          ${isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
        `}
        title={!isOpen ? item.label : ''}
      >
        {/* Active Background Animation */}
        {isActive && (
          <motion.div
            layoutId="activeTabBackground"
            className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-lg shadow-indigo-900/30"
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}

        {/* Icon */}
        <span className={`relative z-10 text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
          <item.icon />
        </span>

        {/* Label (Collapsed State Handling) */}
        <AnimatePresence>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 font-medium whitespace-nowrap flex-1"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge Indicator (e.g., "New") */}
        {isOpen && item.badge && (
          <motion.span 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }}
            className="relative z-10 px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30"
          >
            {item.badge}
          </motion.span>
        )}

        {/* Floating Tooltip for Collapsed State */}
        {!isOpen && (
          <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700 pointer-events-none translate-x-2 group-hover:translate-x-0 transform duration-200">
            {item.label}
            {/* Small arrow */}
            <div className="absolute top-1/2 -left-1 -mt-1 w-2 h-2 bg-slate-800 transform rotate-45 border-l border-b border-slate-700"></div>
          </div>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      <aside 
        className={`
          fixed md:relative z-40 h-screen bg-slate-900 text-white 
          transition-[width] duration-300 ease-in-out border-r border-slate-800 flex flex-col
          ${isOpen ? SIDEBAR_WIDTH_EXPANDED : `${SIDEBAR_WIDTH_COLLAPSED} -translate-x-full md:translate-x-0`}
        `}
      >
        {/* --- HEADER SECTION --- */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => navigate('/')}>
            {/* Logo Icon */}
            <div className="min-w-[40px] w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
              <FiLayers className="text-white text-xl" />
            </div>
            
            {/* Brand Name */}
            <AnimatePresence>
              {isOpen && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex flex-col"
                >
                  <span className="font-bold text-xl tracking-tight leading-none">
                    Smart<span className="text-indigo-400">Inv</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Enterprise</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Close Button (Mobile Only) */}
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <FiChevronLeft size={20} />
          </button>
        </div>

        {/* --- NAVIGATION SCROLL AREA --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-3 space-y-8">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              {/* Group Label */}
              {isOpen && (
                <h3 className="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 transition-opacity duration-300 delay-100">
                  {group.label}
                </h3>
              )}
              {!isOpen && <div className="h-px bg-slate-800 mx-2 mb-4" />}
              
              {/* Group Items */}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* --- PROMO / UPGRADE CARD (Only when open) --- */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="px-4 mb-4"
            >
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 border border-slate-700 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <h4 className="font-bold text-sm mb-1 z-10 relative">Upgrade to Pro</h4>
                <p className="text-xs text-slate-400 mb-3 z-10 relative">Unlock advanced AI models and unlimited exports.</p>
                <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-900/50">
                  View Plans
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- FOOTER (USER PROFILE) --- */}
        <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-900">
          <button 
            onClick={() => navigate('/settings')}
            className={`
              w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500
              ${isOpen ? 'bg-slate-800 border border-slate-700 hover:border-slate-600' : 'justify-center hover:bg-slate-800'}
            `}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-900 font-bold shadow-md">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-800 rounded-full"></span>
            </div>
            
            {/* Info Text */}
            {isOpen && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {user?.email || 'admin@example.com'}
                </p>
              </div>
            )}

            {/* Logout Icon */}
            {isOpen && (
              <div 
                role="button"
                onClick={(e) => { e.stopPropagation(); logout(); }}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Log Out"
              >
                <FiLogOut size={16} />
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;