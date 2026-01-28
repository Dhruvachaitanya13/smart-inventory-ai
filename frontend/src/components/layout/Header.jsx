import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { InventoryService } from '../../services/api';
import { 
  FiSearch, FiMoon, FiSun, FiGlobe, FiBell, FiUser, 
  FiLogOut, FiSettings, FiShield 
} from 'react-icons/fi';
import { debounce } from 'lodash';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  // Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  
  // Dropdown States
  const [showProfile, setShowProfile] = useState(false);
  const [showLang, setShowLang] = useState(false);
  
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  // Debounced Search Logic
  const handleSearch = async (val) => {
    if (val.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await InventoryService.getAll({ search: val, limit: 5 });
      setResults(res.data.data || []);
      setShowResults(true);
    } catch (e) {
      console.error(e);
    }
  };

  const debouncedSearch = useRef(debounce(handleSearch, 300)).current;

  const handleChange = (e) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowResults(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 px-6 flex items-center justify-between">
      
      {/* 1. Global Search with Dropdown */}
      <div className="flex-1 max-w-xl relative" ref={searchRef}>
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder={t('search_placeholder')} 
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all text-sm outline-none"
        />
        
        {showResults && (
          <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl border dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95">
            {results.length > 0 ? (
              results.map(item => (
                <div 
                  key={item._id} 
                  onClick={() => { navigate(`/inventory?search=${item.sku}`); setShowResults(false); }}
                  className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b dark:border-slate-700 last:border-0 flex justify-between items-center group"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.sku}</p>
                  </div>
                  <span className="text-xs bg-indigo-50 dark:bg-slate-600 text-indigo-600 dark:text-slate-300 px-2 py-1 rounded font-mono">
                    ${item.price}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 text-sm">No results found.</div>
            )}
          </div>
        )}
      </div>

      {/* 2. Actions */}
      <div className="flex items-center gap-3 ml-4">
        
        {/* Language */}
        <div className="relative">
          <button onClick={() => setShowLang(!showLang)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full flex items-center gap-1">
            <FiGlobe size={18} /> <span className="text-xs font-bold">{lang}</span>
          </button>
          {showLang && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border dark:border-slate-700 z-50">
              {['EN', 'ES', 'FR', 'DE'].map(l => (
                <button key={l} onClick={() => { setLang(l); setShowLang(false); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 ${lang === l ? 'text-indigo-600 font-bold' : 'dark:text-slate-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme */}
        <button onClick={toggleTheme} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
          {darkMode ? <FiSun className="text-amber-400" /> : <FiMoon />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-1 pr-3 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border dark:border-slate-700 overflow-hidden z-50 animate-in slide-in-from-top-2">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                <p className="text-xs text-slate-500">{t('profile_signed_in')}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.email}</p>
              </div>
              <button onClick={() => navigate('/settings')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FiUser className="text-slate-400" /> {t('profile_my_profile')}
              </button>
              <button onClick={() => navigate('/settings')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FiShield className="text-slate-400" /> {t('profile_security')}
              </button>
              <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
              <button onClick={logout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                <FiLogOut /> {t('nav_logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;