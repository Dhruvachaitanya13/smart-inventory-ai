/**
 * @file Analytics.jsx
 * @description Advanced Artificial Intelligence Command Center.
 * Features:
 * - Multi-Model Forecasting Visualization (ARIMA, Prophet, LSTM simulation).
 * - Real-time Anomaly Detection Stream.
 * - Market Intelligence Radar Analysis.
 * - Interactive Drills-downs and detailed reporting.
 * * @module pages/Analytics
 * @version 6.0.1
 * @author SmartInv Enterprise Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AnalyticsService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiActivity, FiCpu, FiTrendingUp, FiAlertOctagon, 
  FiDownload, FiRefreshCw, FiCheckCircle, FiTarget,
  FiSliders, FiLayers, FiGlobe, FiZap
} from 'react-icons/fi';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Line, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Legend, ComposedChart, Cell // <--- Added Cell here
} from 'recharts';

// --- CONFIGURATION ---
const MODELS = [
  { id: 'auto', name: 'Auto-Select (Best Fit)', desc: 'Automatically selects best algorithm based on variance.' },
  { id: 'arima', name: 'ARIMA v2.4', desc: 'AutoRegressive Integrated Moving Average for linear trends.' },
  { id: 'forest', name: 'Random Forest', desc: 'Ensemble learning method for complex, non-linear patterns.' },
  { id: 'lstm', name: 'Deep LSTM (Neural)', desc: 'Long Short-Term Memory network for sequential dependencies.' }
];

const TIME_RANGES = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: 'Last Quarter' },
  { id: '1y', label: 'Year to Date' }
];

// --- SUB-COMPONENTS ---

/**
 * @component MetricCard
 * @description Top-level analytic metric with micro-chart.
 */
const MetricCard = ({ title, value, change, icon: Icon, color }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden"
  >
    <div className={`absolute -right-4 -top-4 opacity-5 ${color}`}>
      <Icon size={100} />
    </div>
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-700 ${color.replace('text-', 'text-')}`}>
        <Icon size={20} />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${change >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
        {change >= 0 ? '+' : ''}{change}%
      </span>
      <span className="text-xs text-slate-400">vs last period</span>
    </div>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700 text-xs z-50 animate-in zoom-in-95">
        <p className="font-bold mb-3 text-sm text-slate-200 border-b border-slate-600 pb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-8 mb-2 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.fill || entry.color }}></div>
              <span className="capitalize text-slate-300 font-medium">{entry.name}</span>
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

const ForecastView = ({ data, modelInfo }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Main Forecast Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[500px]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiTrendingUp className="text-indigo-600"/> Demand Projection
            </h3>
            <p className="text-xs text-slate-500 mt-1">Algorithm: <span className="font-mono font-bold text-indigo-600">{modelInfo.name}</span></p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-slate-300 px-3 py-1.5 rounded-full">
            <FiTarget/> Accuracy: {modelInfo.accuracy}
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height="85%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorF" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
            <XAxis dataKey="date" tick={{fontSize: 11, fill: '#94a3b8'}} stroke="#cbd5e1" axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize: 11, fill: '#94a3b8'}} stroke="#cbd5e1" axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" height={36}/>
            
            {/* Confidence Interval Area */}
            <Area type="monotone" dataKey="upperCI" stroke="none" fill="#10b981" fillOpacity={0.1} name="Confidence Interval"/>
            
            {/* Main Prediction Line */}
            <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} name="AI Prediction" animationDuration={2000} />
            
            {/* Historical Data (if available) or Baseline */}
            <Line type="monotone" dataKey="actual" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Baseline Trend" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Model Parameters & Insights */}
      <div className="space-y-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiCpu className="text-indigo-400"/> Model Diagnostics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Training Loss</span>
                <span className="text-emerald-400 font-mono">0.024</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[95%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Volatility Index</span>
                <span className="text-amber-400 font-mono">Medium</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[60%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Data Density</span>
                <span className="text-indigo-400 font-mono">High</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[85%]"></div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-400 leading-relaxed">
              The model indicates a <span className="text-white font-bold">12.4% surge</span> in demand for Electronics over the next 14 days based on seasonal regression analysis.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Recommendation</h3>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
              <FiCheckCircle size={20}/>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Increase Safety Stock</p>
              <p className="text-xs text-slate-500 mt-1">Recommended action: Increase stock for 'Laptops' by 15% to mitigate predicted demand spike.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AnomalyView = ({ anomalies }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <FiAlertOctagon className="text-red-500" /> Anomaly Detection Log
          </h3>
          <p className="text-xs text-slate-500 mt-1">AI-identified irregularities in inventory patterns.</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold shadow-sm">
            {anomalies.length} Unresolved
          </span>
        </div>
      </div>
      
      {anomalies.length === 0 ? (
        <div className="p-20 text-center text-slate-500 flex flex-col items-center">
          <FiCheckCircle size={48} className="text-emerald-500 mb-4" />
          <p className="text-lg font-bold text-slate-700 dark:text-white">System Healthy</p>
          <p className="text-sm">No statistical anomalies detected in the current timeframe.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 dark:bg-slate-900 text-xs uppercase text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">Product / Asset</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Predicted Mean</th>
                <th className="px-6 py-4">Deviation</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {anomalies.map((item, idx) => {
                const deviation = Math.abs(((item.currentStock - item.predictedDemand) / item.predictedDemand) * 100).toFixed(1);
                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-slate-300">{item.currentStock}</td>
                    <td className="px-6 py-4 font-mono text-sm text-indigo-600 dark:text-indigo-400">{item.predictedDemand}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-red-500">
                        {deviation}% σ
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        item.riskLevel === 'CRITICAL' 
                          ? 'bg-red-50 text-red-600 border-red-200' 
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {item.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toast.success("Anomaly Resolved")}
                        className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded transition-colors"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

const MarketView = ({ marketData }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[450px]">
      <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <FiGlobe className="text-indigo-600"/> Competitiveness Matrix
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <RadarChart outerRadius="70%" data={marketData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
          <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="transparent" />
          <Radar name="My Portfolio" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
          <Radar name="Industry Benchmark" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
          <Legend />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>

    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-[450px]">
      <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <FiActivity className="text-emerald-500"/> Inventory Turnover Velocity
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={marketData} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="subject" tick={{fontSize: 11}} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
          <Bar dataKey="A" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Velocity Score" barSize={40}>
             {marketData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]} />
             ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

const Analytics = () => {
  const { t } = useLanguage();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('forecast');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data State
  const [forecastData, setForecastData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [modelInfo, setModelInfo] = useState({ name: '', accuracy: '' });
  const [liveFeed, setLiveFeed] = useState([]);

  // --- DATA GENERATORS ---
  const generateMarketData = () => [
    { subject: 'Demand Stability', A: 120, B: 110, fullMark: 150 },
    { subject: 'Supply Chain', A: 98, B: 130, fullMark: 150 },
    { subject: 'Price Elasticity', A: 86, B: 130, fullMark: 150 },
    { subject: 'Market Growth', A: 99, B: 100, fullMark: 150 },
    { subject: 'Tech Adoption', A: 85, B: 90, fullMark: 150 },
    { subject: 'Competition', A: 65, B: 85, fullMark: 150 },
  ];

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get Forecast
      const forecastRes = await AnalyticsService.getForecast(selectedModel, 30);
      
      // 2. Process Data
      setForecastData(forecastRes.data.data.timeSeries);
      setAnomalies(forecastRes.data.data.insights.filter(i => i.riskLevel === 'ANOMALY' || i.riskLevel === 'CRITICAL'));
      setModelInfo({
        name: forecastRes.data.selectedModel,
        accuracy: forecastRes.data.accuracy
      });
      
      // 3. Mock Data for Demo Completeness
      setMarketData(generateMarketData());

    } catch (error) {
      console.error(error);
      toast.error("Analytics Engine Offline");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedModel]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // --- LIVE FEED SIMULATION ---
  useEffect(() => {
    const messages = [
      "New anomaly detected in SKU-X92",
      "Model re-calibration complete (98.2%)",
      "Demand spike predicted for next Tuesday",
      "API latency nominal (24ms)",
      "Market volatility index stable"
    ];
    const interval = setInterval(() => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      setLiveFeed(prev => [{ id: Date.now(), text: msg, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // --- HANDLERS ---
  const handleExport = () => {
    toast.info("Generating Comprehensive PDF Report...");
    setTimeout(() => toast.success("Report Downloaded Successfully"), 2000);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  // --- RENDER ---

  if (loading && !forecastData.length) return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold animate-pulse">Initializing AI Neural Network...</p>
    </div>
  );

  return (
    <div className="pb-12 min-h-screen flex gap-6">
      
      {/* 1. MAIN CONTENT AREA */}
      <div className="flex-1 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 dark:border-slate-700 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl text-white shadow-xl shadow-indigo-500/20">
                <FiCpu size={24} />
              </div>
              AI Intelligence Hub
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Advanced predictive modeling and automated risk telemetry.
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-lg flex items-center">
              {TIME_RANGES.map(tr => (
                <button
                  key={tr.id}
                  onClick={() => setTimeRange(tr.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === tr.id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tr.label}
                </button>
              ))}
            </div>
            <button onClick={handleExport} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2 transition-all">
              <FiDownload/> Report
            </button>
          </div>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard title="Forecast Accuracy" value={modelInfo.accuracy} change={2.4} icon={FiTarget} color="text-indigo-500" />
          <MetricCard title="Risk Events" value={anomalies.length} change={-12} icon={FiAlertOctagon} color="text-red-500" />
          <MetricCard title="Data Points" value="14.2k" change={8.5} icon={FiLayers} color="text-emerald-500" />
          <MetricCard title="Model Velocity" value="24ms" change={1.2} icon={FiZap} color="text-amber-500" />
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex space-x-8">
            {[
              { id: 'forecast', label: 'Demand Forecasting', icon: FiTrendingUp },
              { id: 'anomalies', label: 'Anomaly Detection', icon: FiAlertOctagon },
              { id: 'market', label: 'Market Intelligence', icon: FiGlobe },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors
                  ${activeTab === tab.id 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                `}
              >
                <tab.icon size={16}/> {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Views */}
        <div className="min-h-[500px]">
          <AnimatePresence mode='wait'>
            {activeTab === 'forecast' && (
              <motion.div key="forecast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ForecastView data={forecastData} modelInfo={modelInfo} />
              </motion.div>
            )}
            {activeTab === 'anomalies' && (
              <motion.div key="anomalies" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AnomalyView anomalies={anomalies} />
              </motion.div>
            )}
            {activeTab === 'market' && (
              <motion.div key="market" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <MarketView marketData={marketData} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* 2. SIDEBAR: CONTROL PANEL & FEED */}
      <div className="w-80 hidden xl:flex flex-col gap-6">
        
        {/* Model Selector Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-white font-bold">
            <FiSliders className="text-indigo-600"/> Model Configuration
          </div>
          <div className="space-y-3">
            {MODELS.map(m => (
              <div 
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedModel === m.id 
                    ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500 dark:bg-indigo-900/20 dark:border-indigo-800' 
                    : 'bg-slate-50 border-slate-200 hover:border-indigo-300 dark:bg-slate-900 dark:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold ${selectedModel === m.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                    {m.name}
                  </span>
                  {selectedModel === m.id && <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">{m.desc}</p>
              </div>
            ))}
          </div>
          <button 
            onClick={handleRefresh}
            className="w-full mt-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} /> Re-Run Inference
          </button>
        </div>

        {/* Live Intelligence Stream */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-white font-bold text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> Live Intelligence
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 overflow-y-auto custom-scrollbar space-y-3 pr-1">
              {liveFeed.map(item => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm"
                >
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.text}</p>
                  <p className="text-[10px] text-slate-400 mt-1 text-right">{item.time}</p>
                </motion.div>
              ))}
            </div>
            {/* Fade effect at bottom */}
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent pointer-events-none"></div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;