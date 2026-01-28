/**
 * ===================================================================================
 * ENTERPRISE HEADER COMPONENT - v2.0
 * ===================================================================================
 * * FEATURES:
 * - Debounced Global Search with Command Palette logic
 * - Real-time Notification Center with actions
 * - Keyboard Accessibility (A11y)
 * - Breadcrumbs & Dynamic Page Titles
 * - User Status Management (Online/Away/DND)
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ensure path is correct
import { debounce } from 'lodash';
import { 
  RiSearchLine, RiNotification3Line, RiMoonLine, RiSunLine, RiMenuLine, 
  RiGlobalLine, RiSettings3Line, RiUserLine, RiLogoutCircleLine, 
  RiCheckDoubleLine, RiDeleteBinLine, RiArrowRightSLine, RiPriceTag3Line, 
  RiFileList3Line, RiCloseLine, RiCommandFill, RiShieldCheckLine, 
  RiQuestionLine, RiLoader4Line, RiCheckboxCircleFill
} from 'react-icons/ri';

// --- CONSTANTS & MOCK DATA ---
const STATUS_OPTIONS = [
  { id: 'online', label: 'Online', color: 'bg-green-500' },
  { id: 'away', label: 'Away', color: 'bg-yellow-500' },
  { id: 'dnd', label: 'Do not disturb', color: 'bg-red-500' },
];

const QUICK_ACTIONS = [
  { id: 'new_prod', label: 'Add Product', icon: RiPriceTag3Line, shortcut: 'P' },
  { id: 'new_order', label: 'Create Order', icon: RiFileList3Line, shortcut: 'O' },
  { id: 'users', label: 'Manage Users', icon: RiUserLine, shortcut: 'U' },
];

const Header = ({ isSidebarOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // Loading state
  const [activeDropdown, setActiveDropdown] = useState(null); 
  const [notifications, setNotifications] = useState([]); // In prod, fetch from API
  const [notifTab, setNotifTab] = useState('all');
  const [userStatus, setUserStatus] = useState('online');
  const [searchResults, setSearchResults] = useState([]);

  // --- REFS ---
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Simulate fetching initial notifications
    setTimeout(() => {
      setNotifications([
        { id: 1, title: 'Low Stock Alert', desc: 'MacBook Pro M2 is below threshold (5 items left).', time: '2 min ago', type: 'alert', read: false },
        { id: 2, title: 'New Order Received', desc: 'Order #ORD-8839 by Sarah Conner.', time: '1 hour ago', type: 'success', read: false },
        { id: 3, title: 'Server Maintenance', desc: 'Scheduled for Sunday at 3 AM.', time: '5 hours ago', type: 'info', read: true },
      ]);
    }, 1000);
  }, []);

  // --- EVENT LISTENERS (CLICK OUTSIDE & KEYBOARD) ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };

    const handleKeyDown = (e) => {
      // Ctrl+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Esc to close dropdowns
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // --- SEARCH LOGIC (DEBOUNCED) ---
  const performSearch = useCallback(debounce((query) => {
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Simulate API Call
    setIsSearching(true);
    setTimeout(() => {
      const mockResults = [
        { id: 1, title: 'MacBook Pro M2', type: 'Product', category: 'Electronics' },
        { id: 2, title: 'Iphone 14 Case', type: 'Product', category: 'Accessories' },
        { id: 3, title: '#ORD-9921', type: 'Order', category: 'Pending' },
        { id: 4, title: 'Jane Doe', type: 'Customer', category: 'VIP' },
      ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
      
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 600); // 600ms network delay simulation
  }, 500), []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val) setIsSearching(true);
    performSearch(val);
  };

  // --- THEME LOGIC ---
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // --- NOTIFICATION HELPERS ---
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  
  const filteredNotifications = useMemo(() => {
    return notifTab === 'unread' ? notifications.filter(n => !n.read) : notifications;
  }, [notifications, notifTab]);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => setNotifications([]);

  // --- BREADCRUMBS ---
  const breadcrumbs = useMemo(() => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return pathnames.map((value, index) => {
      const to = `/${pathnames.slice(0, index + 1).join('/')}`;
      return { label: value.replace(/-/g, ' '), to };
    });
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* LEFT: Mobile Menu & Breadcrumbs */}
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Toggle Sidebar"
            >
              <RiMenuLine size={24} />
            </button>

            <nav className="hidden sm:flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
              <button onClick={() => navigate('/dashboard')} className="hover:text-indigo-600 transition-colors">
                Home
              </button>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.to}>
                  <RiArrowRightSLine className="mx-2 text-slate-400" />
                  <span 
                    className={`capitalize ${index === breadcrumbs.length - 1 ? 'text-slate-800 dark:text-white font-semibold' : 'hover:text-indigo-600 cursor-pointer transition-colors'}`}
                    onClick={() => index !== breadcrumbs.length - 1 && navigate(crumb.to)}
                  >
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* CENTER: Global Command Search */}
          <div className="hidden md:block w-full max-w-lg relative" ref={searchRef}>
            <div className={`
              flex items-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 
              border transition-all duration-200 rounded-xl group
              ${isSearchFocused ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-4 ring-indigo-500/10 shadow-xl' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}
            `}>
              <RiSearchLine className={`mr-3 transition-colors ${isSearchFocused ? 'text-indigo-500' : 'text-slate-400'}`} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search or type a command..."
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
              />
              <div className="flex items-center gap-2">
                {isSearching ? (
                  <RiLoader4Line className="animate-spin text-indigo-500" />
                ) : searchQuery ? (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-slate-400 hover:text-red-500">
                    <RiCloseLine />
                  </button>
                ) : (
                  <div className="hidden lg:flex items-center gap-1">
                    <kbd className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 rounded border-b-2 border-slate-300 dark:border-slate-600">CTRL</kbd>
                    <kbd className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 rounded border-b-2 border-slate-300 dark:border-slate-600">K</kbd>
                  </div>
                )}
              </div>
            </div>

            {/* Expanded Search Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Quick Actions (Command Menu) */}
                {!searchQuery && (
                  <div className="p-2">
                    <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Commands</p>
                    <div className="grid grid-cols-1 gap-1">
                      {QUICK_ACTIONS.map(action => (
                        <button key={action.id} className="w-full flex items-center justify-between px-3 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg group transition-colors">
                          <div className="flex items-center gap-3">
                            <action.icon className="text-slate-400 group-hover:text-indigo-500" />
                            <span>{action.label}</span>
                          </div>
                          <span className="text-xs text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 rounded">{action.shortcut}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {searchQuery && (
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {searchResults.length > 0 ? (
                      <div>
                        <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">Results</p>
                        {searchResults.map(item => (
                          <div key={item.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center group border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${item.type === 'Product' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {item.type === 'Product' ? <RiPriceTag3Line /> : <RiFileList3Line />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-white highlight-text">
                                  {item.title}
                                </p>
                                <p className="text-xs text-slate-500">{item.type} • {item.category}</p>
                              </div>
                            </div>
                            <RiArrowRightSLine className="text-slate-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400">
                        {isSearching ? <p>Searching...</p> : <p>No results found for "{searchQuery}"</p>}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-xs text-slate-400 flex justify-between">
                  <span>Press <kbd>Enter</kbd> to select</span>
                  <span><kbd>Esc</kbd> to close</span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-1 sm:gap-3" ref={dropdownRef}>
            
            {/* Language & Help */}
            <div className="hidden sm:flex items-center">
              <button 
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Support / Help"
              >
                <RiQuestionLine size={20} />
              </button>
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'lang' ? null : 'lang')}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
              >
                <RiGlobalLine size={20} />
              </button>
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              {isDarkMode ? <RiSunLine size={20} className="text-amber-400" /> : <RiMoonLine size={20} />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'notif' ? null : 'notif')}
                className={`p-2 rounded-full transition-colors relative ${activeDropdown === 'notif' ? 'bg-indigo-50 text-indigo-600 dark:bg-slate-800' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <RiNotification3Line size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
                )}
              </button>

              {activeDropdown === 'notif' && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
                    <div className="flex gap-2">
                      <button onClick={clearAllNotifications} className="text-xs text-slate-500 hover:text-red-500 transition-colors">Clear all</button>
                    </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex border-b border-slate-100 dark:border-slate-800">
                    {['all', 'unread'].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setNotifTab(tab)} 
                        className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${notifTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        {tab} {tab === 'unread' && unreadCount > 0 && `(${unreadCount})`}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-12 flex flex-col items-center text-slate-400">
                        <RiNotification3Line size={40} className="mb-2 opacity-20" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      filteredNotifications.map((n) => (
                        <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group ${!n.read ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/50 opacity-75'}`}>
                          <div className="flex gap-3">
                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                            <div className="flex-1">
                              <p className={`text-sm ${!n.read ? 'font-semibold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
                              <p className="text-xs text-slate-500 mt-1">{n.desc}</p>
                              <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wide">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button className="w-full py-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                    View Notification Center
                  </button>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
                className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent focus:outline-none"
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px]">
                    <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
                      {user?.photo ? (
                        <img src={user.photo} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-xs text-indigo-600">{user?.name?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                  </div>
                  {/* Status Indicator */}
                  <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${STATUS_OPTIONS.find(s => s.id === userStatus).color}`}></span>
                </div>
                
                <div className="hidden lg:block text-left mr-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{user?.name?.split(' ')[0]}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-none uppercase tracking-wide font-semibold">{user?.role || 'Guest'}</p>
                </div>
                <RiArrowRightSLine className={`text-slate-400 transition-transform duration-200 ${activeDropdown === 'profile' ? 'rotate-90' : 'rotate-0'}`} />
              </button>

              {activeDropdown === 'profile' && (
                <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200 z-50 overflow-hidden">
                  
                  {/* User Info Header */}
                  <div className="p-5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <RiCommandFill size={60} />
                    </div>
                    <p className="font-bold text-lg relative z-10">{user?.name}</p>
                    <p className="text-xs text-indigo-100 relative z-10">{user?.email}</p>
                  </div>

                  {/* Status Selector */}
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">Set Status</p>
                    <div className="grid grid-cols-3 gap-1">
                      {STATUS_OPTIONS.map(status => (
                        <button 
                          key={status.id}
                          onClick={() => setUserStatus(status.id)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs transition-colors ${userStatus === status.id ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          <span className={`w-2 h-2 rounded-full mb-1 ${status.color}`}></span>
                          {status.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="p-2">
                    <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <RiUserLine className="text-slate-400" /> My Profile
                    </button>
                    <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <RiSettings3Line className="text-slate-400" /> Account Settings
                    </button>
                    <button onClick={() => navigate('/security')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <RiShieldCheckLine className="text-slate-400" /> Security Log
                    </button>
                  </div>

                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <button 
                      onClick={logout}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <RiLogoutCircleLine /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;