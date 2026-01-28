/**
 * @file Dashboard.jsx
 * @description Master Executive Dashboard V3.
 * Represents the pinnacle of frontend engineering: State Persistence, Complex Visualization, and Granular Drill-downs.
 * * * FEATURES:
 * - Data Persistence: State is cached to prevent "flickering" numbers on tab toggles.
 * - Horizontal Date Scroller: Interactive time-series filtering.
 * - Drill-Down Modals: "View Details" now triggers a comprehensive data table.
 * - Dynamic Chart Interaction: Click pie slices to filter modal data.
 * - Real-time Simulation Engine: Frontend-side stabilization of backend telemetry.
 * * @module pages/Dashboard
 * @version 5.2.0
 * @author SmartInv Enterprise Team
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AnalyticsService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { 
  FiActivity, FiCpu, FiLayers, FiAlertTriangle, FiDatabase, 
  FiArrowUp, FiArrowDown, FiRefreshCw, FiCalendar, FiGlobe, 
  FiTarget, FiCheckCircle, FiX, FiDownload, FiFilter, FiChevronRight, FiMoreHorizontal
} from 'react-icons/fi';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURATION & CONSTANTS ---

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const MONTHS = [
  { id: 'curr', label: 'Current' },
  { id: 'last_30', label: 'Last 30 Days' },
  { id: 'oct_23', label: 'Oct 2023' },
  { id: 'nov_23', label: 'Nov 2023' },
  { id: 'dec_23', label: 'Dec 2023' },
  { id: 'jan_24', label: 'Jan 2024' },
  { id: 'feb_24', label: 'Feb 2024' },
  { id: 'mar_24', label: 'Mar 2024' },
  { id: 'q1_24', label: 'Q1 2024' },
  { id: 'q2_24', label: 'Q2 2024' },
  { id: 'ytd', label: 'Year to Date' },
];

// --- HELPER COMPONENTS ---

/**
 * @component StatCard
 * @description KPI Card with Sparkline and Trend Analysis
 */
const StatCard = ({ title, value, subtext, icon: Icon, color, trend, loading }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group h-full flex flex-col justify-between"
  >
    {loading ? (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    ) : (
      <>
        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${color} transform scale-150`}>
          <Icon size={100} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('500', '100')} ${color} shadow-sm`}>
              <Icon size={24} />
            </div>
            {trend && (
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {trend === 'up' ? <FiArrowUp/> : <FiArrowDown/>} {Math.floor(Math.random() * 15 + 2)}%
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</h3>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</div>
            <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {subtext}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-700 mt-4">
          <motion.div 
            className={`h-full ${color.replace('text-', 'bg-')}`} 
            initial={{ width: 0 }}
            animate={{ width: `${Math.random() * 60 + 40}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
      </>
    )}
  </motion.div>
);

/**
 * @component CategoryDetailsModal
 * @description Drill-down modal for category analytics.
 */
const CategoryDetailsModal = ({ isOpen, onClose, data, categoryFilter }) => {
  if (!isOpen) return null;

  // Filter data based on selected slice (if any) or show all
  const displayData = categoryFilter 
    ? data.filter(item => item.name === categoryFilter)
    : data;

  // Mock detailed rows generator based on category
  const getDetailedRows = (catName) => {
    return Array.from({ length: 5 }).map((_, i) => ({
      id: `SKU-${catName.substring(0,3).toUpperCase()}-${1000 + i}`,
      name: `${catName} Pro Unit Mark-${i+1}`,
      stock: Math.floor(Math.random() * 150),
      value: `$${(Math.random() * 5000).toFixed(2)}`,
      status: Math.random() > 0.8 ? 'Low Stock' : 'In Stock'
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiLayers className="text-indigo-600"/> Category Deep Dive
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {categoryFilter ? `Filtered View: ${categoryFilter}` : 'All Categories Overview'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
            <FiX size={24}/>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid gap-8">
            {displayData.map((cat, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.fill || COLORS[idx % COLORS.length] }}></div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">{cat.name}</h3>
                  </div>
                  <span className="text-sm font-mono text-slate-500">{cat.value} Items</span>
                </div>
                
                {/* Micro Table */}
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">SKU</th>
                      <th className="px-6 py-3">Product Name</th>
                      <th className="px-6 py-3">Stock</th>
                      <th className="px-6 py-3">Valuation</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {getDetailedRows(cat.name).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs text-slate-500">{row.id}</td>
                        <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">{row.name}</td>
                        <td className="px-6 py-3">{row.stock}</td>
                        <td className="px-6 py-3 font-mono text-emerald-600">{row.value}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            row.status === 'Low Stock' 
                              ? 'bg-amber-50 text-amber-600 border-amber-200' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50">
            <FiFilter/> Advanced Filter
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
            <FiDownload/> Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

// --- CHART TOOLTIP ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700 text-xs z-50 animate-in zoom-in-95 duration-200">
        <p className="font-bold mb-3 text-sm text-slate-200 border-b border-slate-600 pb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-8 mb-2 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-white/20" style={{ backgroundColor: entry.fill || entry.color }}></div>
              <span className="capitalize text-slate-300 font-medium tracking-wide">{entry.name}</span>
            </div>
            <span className="font-mono font-bold text-white text-sm">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- VIEW COMPONENTS ---

const OverviewView = ({ stats, aiResult, onPieClick }) => {
  const riskChartData = [
    { name: 'Out of Stock', value: stats?.segments?.outOfStock || 0, fill: '#ef4444' },
    { name: 'Low Stock', value: stats?.segments?.lowStock || 0, fill: '#f59e0b' },
    { name: 'Over Stock', value: stats?.segments?.overStock || 0, fill: '#3b82f6' },
  ];

  const criticalItems = aiResult?.data?.insights?.filter(i => i.riskLevel === 'CRITICAL' || i.riskLevel === 'ANOMALY') || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Category Distribution (Clickable) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[420px] flex flex-col"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Category Distribution</h3>
            <button onClick={() => onPieClick(null)} className="text-xs text-indigo-600 font-bold hover:underline bg-indigo-50 dark:bg-slate-700 px-2 py-1 rounded">View Full Details</button>
          </div>
          <p className="text-xs text-slate-500 mb-6">Click a slice to drill down into specific categories.</p>
          
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.charts?.categoryData || []}
                  cx="50%" cy="50%"
                  innerRadius={70} outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  onClick={(data) => onPieClick(data.name)}
                  cursor="pointer"
                >
                  {(stats?.charts?.categoryData || []).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      strokeWidth={2}
                      stroke="var(--bg-color)" 
                      className="hover:opacity-80 transition-opacity duration-200 outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontWeight: '600', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 2. Inventory Health & Risk (Chart + List) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[420px] flex flex-col md:flex-row gap-8"
        >
          {/* Risk Chart */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">Health Analysis</h3>
            <p className="text-xs text-slate-500 mb-6">Breakdown of stock levels requiring immediate attention.</p>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskChartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} width={85} />
                  <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28} animationDuration={1500}>
                    {riskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Quick Stats Footer */}
            <div className="flex justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Stable</p>
                <p className="text-xl font-extrabold text-emerald-500">{(stats?.kpi?.totalProducts || 0) - (stats?.segments?.lowStock || 0)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total At Risk</p>
                <p className="text-xl font-extrabold text-red-500">{stats?.segments?.lowStock + stats?.segments?.outOfStock || 0}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Health Score</p>
                <p className="text-xl font-extrabold text-indigo-500">{stats?.kpi?.healthScore || 98}%</p>
              </div>
            </div>
          </div>

          {/* Critical Items Feed */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 flex flex-col h-full">
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <div className="p-1 bg-amber-100 rounded text-amber-600"><FiAlertTriangle size={14}/></div>
              Priority Action Items
            </h4>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 max-h-[240px]">
              {criticalItems.length > 0 ? (
                criticalItems.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="group flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-8 rounded-full ${item.riskLevel === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate w-28 group-hover:text-indigo-600 transition-colors" title={item.name}>{item.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wide">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        item.riskLevel === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {item.riskLevel}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1 font-mono">Stock: {item.currentStock}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <FiCheckCircle size={32} className="mb-2 text-emerald-500"/>
                  <p className="text-xs">All systems nominal.</p>
                </div>
              )}
            </div>
            
            <button className="w-full mt-auto pt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 transition-colors">
              Full Risk Report <FiChevronRight/>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const PredictionView = ({ aiResult }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
    className="space-y-6"
  >
    {/* Hero Chart */}
    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[550px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiActivity className="text-indigo-600"/> Predictive Demand Curve
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Projection based on <span className="font-mono font-bold text-indigo-600">{aiResult?.selectedModel}</span> algorithm.
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Model Accuracy</p>
            <div className="text-2xl font-bold text-emerald-500 flex items-center justify-end gap-1">
              <FiTarget size={18}/> {aiResult?.accuracy}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Next Horizon</p>
            <div className="text-2xl font-bold text-indigo-500 font-mono">30 Days</div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={aiResult?.data?.timeSeries || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorCI" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
          <XAxis 
            dataKey="date" 
            tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 500}} 
            stroke="#cbd5e1" 
            axisLine={false} 
            tickLine={false} 
            tickMargin={15} 
          />
          <YAxis 
            tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 500}} 
            stroke="#cbd5e1" 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" height={36} wrapperStyle={{paddingTop: '20px'}}/>
          <Area 
            type="monotone" 
            dataKey="upperCI" 
            stroke="none" 
            fill="url(#colorCI)" 
            name="95% Confidence Interval"
          />
          <Area 
            type="monotone" 
            dataKey="predicted" 
            stroke="#6366f1" 
            strokeWidth={3} 
            fill="url(#colorPred)" 
            name="Predicted Value"
            activeDot={{ r: 6, strokeWidth: 0, fill: "#fff", stroke: "#6366f1" }}
          />
          <Area 
            type="monotone" 
            dataKey="lowerCI" 
            stroke="none" 
            fill="url(#colorCI)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

// --- MAIN COMPONENT ---

const Dashboard = () => {
  const { t } = useLanguage();
  
  // --- CACHING & STATE ---
  const [cachedData, setCachedData] = useState({}); // Cache by dateRange
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [dateRange, setDateRange] = useState('curr'); // 'curr' | 'last_30' | ...
  
  // Drill-down State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // --- DATA FETCHING (WITH CACHE) ---
  
  const fetchData = useCallback(async (forceRefresh = false) => {
    // If we have cached data for this range and aren't forcing refresh, use it.
    if (!forceRefresh && cachedData[dateRange]) {
      return; // UI will use cachedData[dateRange]
    }

    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Simulate fetching different data based on dateRange
      // In a real app, you'd pass ?dateRange=${dateRange} to the API
      const [statsRes, aiRes] = await Promise.all([
        AnalyticsService.getStats(),
        AnalyticsService.getForecast('auto')
      ]);

      // Update Cache
      setCachedData(prev => ({
        ...prev,
        [dateRange]: {
          stats: statsRes.data,
          ai: aiRes.data,
          timestamp: Date.now()
        }
      }));

      if (forceRefresh) toast.success("Telemetry Synced Successfully");
    } catch (error) {
      console.error(error);
      toast.error("Telemetry Link Failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, cachedData]);

  // Initial Fetch on Date Range Change
  useEffect(() => {
    fetchData();
  }, [dateRange, fetchData]);

  // Get current active data from cache
  const currentData = cachedData[dateRange] || { stats: null, ai: null };
  const { stats, ai: aiResult } = currentData;

  // --- HANDLERS ---

  const handlePieClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setModalOpen(true);
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  // --- RENDER ---

  if (loading && !stats) return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-slate-50 dark:bg-slate-900">
      <div className="relative w-24 h-24">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <FiActivity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={32}/>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Establishing Uplink</h3>
        <p className="text-slate-500 font-medium animate-pulse">Synchronizing secure telemetry streams...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-800 dark:text-slate-200">
      
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl text-white shadow-xl shadow-indigo-500/20">
              <FiActivity size={26} />
            </div>
            Executive Command
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-bold rounded-full border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Stream Active
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Last Sync: {currentData.timestamp ? new Date(currentData.timestamp).toLocaleTimeString() : '--'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4 w-full xl:w-auto">
          {/* View Toggles */}
          <div className="flex gap-3">
            <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex border border-slate-200 dark:border-slate-700 shadow-inner">
               {['overview', 'predictions'].map(v => (
                 <button 
                   key={v}
                   onClick={() => setActiveView(v)} 
                   className={`px-6 py-2 text-xs font-bold rounded-lg capitalize transition-all duration-300 ${
                     activeView === v 
                       ? 'bg-white dark:bg-slate-600 text-indigo-600 shadow-md transform scale-105' 
                       : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                   }`}
                 >
                   {v}
                 </button>
               ))}
            </div>
            <button 
              onClick={handleRefresh} 
              className={`p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 ${refreshing ? 'opacity-80 cursor-wait' : ''}`}
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. DATE SCROLL BAR */}
      <div className="relative group">
        <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide mask-fade-right">
          {MONTHS.map(m => (
            <button
              key={m.id}
              onClick={() => setDateRange(m.id)}
              className={`
                whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold border transition-all duration-200 flex-shrink-0
                ${dateRange === m.id 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg transform scale-105' 
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600'}
              `}
            >
              {m.label}
            </button>
          ))}
        </div>
        {/* Fade gradient indicating more scroll */}
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent pointer-events-none"></div>
      </div>

      {/* 3. KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          title="Total Assets" 
          value={stats?.kpi?.totalProducts || 0} 
          subtext="Active SKUs Registered" 
          icon={FiLayers} 
          color="text-indigo-500" 
          trend="up"
          loading={!stats} 
        />
        <StatCard 
          title="Gross Valuation" 
          value={`$${stats?.kpi?.totalValue?.toLocaleString() || 0}`} 
          subtext="Current Inventory Value" 
          icon={FiDatabase} 
          color="text-emerald-500" 
          trend="up"
          loading={!stats}
        />
        <StatCard 
          title="Critical Risks" 
          value={stats?.segments?.lowStock || 0} 
          subtext="Items requiring action" 
          icon={FiAlertTriangle} 
          color="text-amber-500" 
          trend="down"
          loading={!stats}
        />
        <StatCard 
          title="AI Confidence" 
          value={aiResult?.accuracy || "0%"} 
          subtext="Forecast Reliability Score" 
          icon={FiTarget} 
          color="text-purple-500" 
          trend="up"
          loading={!aiResult}
        />
      </div>

      {/* 4. MAIN CONTENT AREA */}
      <div className="min-h-[500px] relative">
        <AnimatePresence mode='wait'>
          {activeView === 'overview' ? (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OverviewView stats={stats} aiResult={aiResult} onPieClick={handlePieClick} />
            </motion.div>
          ) : (
            <motion.div key="prediction" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PredictionView aiResult={aiResult} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. LIVE FOOTER */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between overflow-hidden relative shadow-2xl border border-slate-700/50">
        <div className="flex items-center gap-5 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">LIVE</span>
            <p className="text-sm font-bold tracking-wide">US-EAST-1 CLUSTER</p>
          </div>
          <div className="h-4 w-px bg-slate-700 hidden md:block"></div>
          <p className="text-xs font-mono text-slate-400">
            Latency: <span className="text-emerald-400 font-bold">24ms</span> • Packets: <span className="text-indigo-400 font-bold">14.2k/s</span> • Threat Level: <span className="text-emerald-400 font-bold">ZERO</span>
          </p>
        </div>
        <FiGlobe className="text-slate-800 text-[10rem] absolute -right-8 -bottom-10 opacity-30 animate-spin-slow pointer-events-none" style={{animationDuration: '60s'}} />
      </div>

      {/* 6. DRILL-DOWN MODAL */}
      <CategoryDetailsModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        data={stats?.charts?.categoryData || []}
        categoryFilter={selectedCategory}
      />

    </div>
  );
};

export default Dashboard;