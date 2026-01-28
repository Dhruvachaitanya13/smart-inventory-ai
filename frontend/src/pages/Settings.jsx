/**
 * @file Settings.jsx
 * @description Comprehensive System Configuration & Profile Management Page.
 * Features:
 * - Tabbed Interface (General, Account, Notifications, Security, API)
 * - Granular Preference Toggles
 * - Simulated API Key Generation
 * - Form Validation & Dirty State Tracking
 * - Responsive Layout
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-toastify';
import { 
  FiSettings, FiUser, FiBell, FiCpu, FiShield, FiKey, 
  FiSave, FiRefreshCw, FiToggleLeft, FiToggleRight, FiCheck 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
  const { t } = useLanguage();
  const { darkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    title: 'Senior Administrator',
    bio: 'Responsible for global inventory oversight and AI systems analysis.'
  });

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    email_alerts: true,
    push_notifications: false,
    weekly_digest: true,
    security_alerts: true,
    marketing_emails: false
  });

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState({
    confidence_threshold: 85,
    forecast_horizon: 30,
    model_preference: 'auto',
    auto_restock: false
  });

  // API Key State (Simulated)
  const [apiKey, setApiKey] = useState('sk_live_**********************ab92');
  const [showKey, setShowKey] = useState(false);

  // --- HANDLERS ---

  /**
   * Handle Profile Input Changes
   */
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  /**
   * Handle Toggle Switch Changes
   */
  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    setIsDirty(true);
  };

  /**
   * Simulate API Key Generation
   */
  const generateApiKey = () => {
    const prefix = 'sk_live_';
    const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(prefix + random);
    setShowKey(true);
    toast.success('New API Key Generated. Please copy it immediately.');
    setIsDirty(true);
  };

  /**
   * Save All Changes (Simulated Backend Call)
   */
  const handleSave = async () => {
    setLoading(true);
    
    // Simulate API Latency
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Success Logic
    toast.success('System Configuration Updated Successfully');
    setLoading(false);
    setIsDirty(false);
  };

  // --- SUB COMPONENTS ---

  const Toggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div className="flex-1 pr-4">
        <h4 className="text-sm font-bold text-slate-800 dark:text-white">{label}</h4>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
      <button 
        onClick={onChange}
        className={`text-3xl transition-colors ${checked ? 'text-indigo-600' : 'text-slate-300 dark:text-slate-600'}`}
      >
        {checked ? <FiToggleRight /> : <FiToggleLeft />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 animate-in fade-in">
      {/* Header Container */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings & Configuration</h1>
          <p className="text-slate-500 mt-2">Manage your account, system preferences, and integration keys.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* 1. SIDEBAR NAVIGATION */}
          <div className="w-full lg:w-72 space-y-2 sticky top-24 h-fit">
            {[
              { id: 'general', label: 'General', icon: FiSettings, desc: 'Theme & Display' },
              { id: 'account', label: 'Account Profile', icon: FiUser, desc: 'Personal Details' },
              { id: 'notifications', label: 'Notifications', icon: FiBell, desc: 'Alert Preferences' },
              { id: 'ai', label: 'AI Parameters', icon: FiCpu, desc: 'Model Tuning' },
              { id: 'security', label: 'API & Security', icon: FiShield, desc: 'Keys & Access' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 text-left border
                  ${activeTab === tab.id 
                    ? 'bg-white dark:bg-slate-800 border-indigo-500 ring-1 ring-indigo-500 shadow-md' 
                    : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-slate-800 text-slate-500'}
                `}
              >
                <div className={`p-2 rounded-lg ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                  <tab.icon size={18} />
                </div>
                <div>
                  <span className={`block font-bold text-sm ${activeTab === tab.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    {tab.label}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{tab.desc}</span>
                </div>
              </button>
            ))}
          </div>

          {/* 2. CONTENT AREA */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 min-h-[600px] relative">
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold dark:text-white mb-6">General Preferences</h2>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-bold dark:text-white">Appearance</h3>
                        <p className="text-sm text-slate-500">Customize the look and feel of the dashboard.</p>
                      </div>
                      <button 
                        onClick={toggleTheme}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white"
                      >
                        {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                      </button>
                    </div>

                    <Toggle 
                      label="Dense Mode" 
                      description="Reduce whitespace in data tables for higher information density."
                      checked={false} 
                      onChange={() => {}}
                    />
                    <Toggle 
                      label="Auto-Save Forms" 
                      description="Automatically save changes as you type in supported forms."
                      checked={true} 
                      onChange={() => {}}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ACCOUNT TAB */}
            {activeTab === 'account' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-xl font-bold dark:text-white mb-6">Personal Profile</h2>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl text-white font-bold shadow-lg">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors">
                      Upload New Photo
                    </button>
                    <p className="text-xs text-slate-400 mt-2">Recommended: 400x400px JPG/PNG</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      value={profileData.email}
                      disabled
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Job Title</label>
                    <input 
                      type="text" 
                      name="title"
                      value={profileData.title}
                      onChange={handleProfileChange}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Bio</label>
                    <textarea 
                      name="bio"
                      rows="3"
                      value={profileData.bio}
                      onChange={handleProfileChange}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-xl font-bold dark:text-white mb-6">Notification Preferences</h2>
                
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700">
                  <Toggle 
                    label="Email Alerts" 
                    description="Receive crucial system updates and password resets via email."
                    checked={notifications.email_alerts} 
                    onChange={() => toggleNotification('email_alerts')}
                  />
                  <Toggle 
                    label="Push Notifications" 
                    description="Receive real-time alerts in your browser."
                    checked={notifications.push_notifications} 
                    onChange={() => toggleNotification('push_notifications')}
                  />
                  <Toggle 
                    label="Weekly AI Digest" 
                    description="A summary of AI insights sent every Monday morning."
                    checked={notifications.weekly_digest} 
                    onChange={() => toggleNotification('weekly_digest')}
                  />
                  <Toggle 
                    label="Security Alerts" 
                    description="Get notified of unrecognized login attempts immediately."
                    checked={notifications.security_alerts} 
                    onChange={() => toggleNotification('security_alerts')}
                  />
                </div>
              </motion.div>
            )}

            {/* AI CONFIGURATION TAB */}
            {activeTab === 'ai' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-xl font-bold dark:text-white mb-6">AI Model Parameters</h2>
                
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="font-bold text-sm text-slate-700 dark:text-slate-300">Confidence Threshold</label>
                      <span className="text-sm font-mono text-indigo-600 font-bold">{aiConfig.confidence_threshold}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" max="99" 
                      value={aiConfig.confidence_threshold}
                      onChange={(e) => { setAiConfig({...aiConfig, confidence_threshold: e.target.value}); setIsDirty(true); }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <p className="text-xs text-slate-500 mt-2">Predictions below this confidence level will be flagged for human review.</p>
                  </div>

                  <div>
                    <label className="font-bold text-sm text-slate-700 dark:text-slate-300 block mb-2">Default Forecast Horizon</label>
                    <select 
                      value={aiConfig.forecast_horizon}
                      onChange={(e) => { setAiConfig({...aiConfig, forecast_horizon: e.target.value}); setIsDirty(true); }}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="7">7 Days (Short Term)</option>
                      <option value="30">30 Days (Standard)</option>
                      <option value="90">90 Days (Quarterly)</option>
                    </select>
                  </div>

                  <Toggle 
                    label="Auto-Restock Recommendations" 
                    description="Allow the AI to suggest purchase orders automatically when stock is critical."
                    checked={aiConfig.auto_restock} 
                    onChange={() => { setAiConfig(p => ({...p, auto_restock: !p.auto_restock})); setIsDirty(true); }}
                  />
                </div>
              </motion.div>
            )}

            {/* SAVE BUTTON (Sticky Footer) */}
            <div className={`
              absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 rounded-b-2xl
              flex justify-between items-center transition-all duration-300 transform
              ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
            `}>
              <span className="text-sm text-slate-500">You have unsaved changes.</span>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-500/30 disabled:opacity-70 transition-all"
              >
                {loading ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;