/**
 * @file Reports.jsx
 * @description System Operations Center & Audit Logging.
 * Features:
 * - Real-time Server Telemetry (CPU/RAM Simulation).
 * - Live Uptime Ticker.
 * - Searchable, Filterable Audit Log Stream.
 * - Report Generation Engine.
 * - Deep-dive Log Inspection Modal.
 * * @module pages/Reports
 * @version 6.0.0
 * @author SmartInv Enterprise Team
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FiFileText, FiDownload, FiClock, FiCheck, FiAlertCircle, 
  FiSearch, FiRefreshCw, FiServer, FiCpu, FiActivity, FiX, 
  FiChevronDown, FiFilter, FiShield, FiUser, FiGlobe 
} from 'react-icons/fi';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURATION ---
const SYSTEM_START_TIME = Date.now() - (14 * 24 * 60 * 60 * 1000) - (3 * 60 * 60 * 1000); // 14d 3h ago
const LOG_TYPES = ['User Login', 'Inventory Update', 'API Request', 'System Backup', 'Security Alert', 'Data Export'];
const USERS = ['Admin', 'System', 'Manager_Dave', 'Auditor_Jane'];
const STATUSES = ['Success', 'Success', 'Success', 'Warning', 'Failed'];

// --- SUB-COMPONENTS ---

/**
 * @component TelemetryChart
 * @description Live CPU/Memory usage graph.
 */
const TelemetryChart = ({ data }) => (
  <div className="h-[120px] w-full mt-4">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
          itemStyle={{ color: '#e2e8f0' }}
        />
        <Area 
          type="monotone" 
          dataKey="cpu" 
          stroke="#6366f1" 
          strokeWidth={2} 
          fill="url(#colorCpu)" 
          isAnimationActive={false} // Disable animation for smooth real-time feel
        />
        <Line 
          type="monotone" 
          dataKey="memory" 
          stroke="#10b981" 
          strokeWidth={2} 
          dot={false} 
          isAnimationActive={false} 
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

/**
 * @component LogDetailModal
 * @description Modal to view full JSON payload of a log entry.
 */
const LogDetailModal = ({ isOpen, onClose, log }) => {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${log.status === 'Success' ? 'bg-emerald-100 text-emerald-600' : log.status === 'Failed' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
              {log.status === 'Success' ? <FiCheck size={20}/> : <FiAlertCircle size={20}/>}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Event #{log.id} Details</h3>
              <p className="text-xs text-slate-500">{log.time} • {log.ip}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
            <FiX size={20}/>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Action Type</p>
              <p className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{log.action}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Initiator</p>
              <div className="flex items-center gap-2">
                <FiUser size={12}/> <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{log.user}</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Source IP</p>
              <div className="flex items-center gap-2">
                <FiGlobe size={12}/> <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{log.ip}</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Latency</p>
              <div className="flex items-center gap-2">
                <FiActivity size={12}/> <span className="font-mono text-sm font-bold text-emerald-500">24ms</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Raw Payload</p>
            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-emerald-400">
{JSON.stringify({
  event_id: log.id,
  timestamp: new Date().toISOString(),
  actor: {
    id: "usr_8291",
    name: log.user,
    role: "admin"
  },
  action: log.action,
  status: log.status.toUpperCase(),
  meta: {
    ip_address: log.ip,
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    region: "us-east-1"
  }
}, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const Reports = () => {
  
  // --- STATE ---
  const [uptime, setUptime] = useState(0);
  const [telemetry, setTelemetry] = useState(Array.from({ length: 20 }, () => ({ cpu: 20, memory: 40 })));
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [itemsToShow, setItemsToShow] = useState(8);

  // Download State
  const [generatingReport, setGeneratingReport] = useState(null);

  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);

  // --- INITIAL DATA GENERATION ---
  useEffect(() => {
    // Generate initial logs
    const initialLogs = Array.from({ length: 15 }).map((_, i) => ({
      id: 1000 + i,
      action: LOG_TYPES[Math.floor(Math.random() * LOG_TYPES.length)],
      user: USERS[Math.floor(Math.random() * USERS.length)],
      time: `${Math.floor(Math.random() * 59)} mins ago`,
      status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    }));
    setLogs(initialLogs);
    setLoadingLogs(false);
  }, []);

  // --- LIVE TELEMETRY SIMULATION ---
  useEffect(() => {
    const interval = setInterval(() => {
      // Update Uptime
      setUptime(Date.now() - SYSTEM_START_TIME);

      // Update Chart Data (Shift array)
      setTelemetry(prev => {
        const newCpu = Math.max(10, Math.min(90, prev[prev.length - 1].cpu + (Math.random() * 20 - 10)));
        const newMem = Math.max(20, Math.min(80, prev[prev.length - 1].memory + (Math.random() * 10 - 5)));
        return [...prev.slice(1), { cpu: Math.round(newCpu), memory: Math.round(newMem) }];
      });

      // Randomly add new log every ~8 seconds
      if (Math.random() > 0.8) {
        const newLog = {
          id: Date.now(),
          action: LOG_TYPES[Math.floor(Math.random() * LOG_TYPES.length)],
          user: USERS[Math.floor(Math.random() * USERS.length)],
          time: 'Just now',
          status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
          ip: `10.0.${Math.floor(Math.random() * 50)}.${Math.floor(Math.random() * 255)}`
        };
        setLogs(prev => [newLog, ...prev]);
      }

    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format milliseconds to dd:hh:mm:ss
  const formatUptime = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return (
      <div className="flex gap-3 font-mono text-2xl md:text-3xl font-bold tracking-tight">
        <div className="flex flex-col items-center"><span className="text-white">{days}</span><span className="text-[10px] text-indigo-200 uppercase font-sans">Days</span></div>
        <span className="text-indigo-400">:</span>
        <div className="flex flex-col items-center"><span className="text-white">{hours.toString().padStart(2, '0')}</span><span className="text-[10px] text-indigo-200 uppercase font-sans">Hrs</span></div>
        <span className="text-indigo-400">:</span>
        <div className="flex flex-col items-center"><span className="text-white">{minutes.toString().padStart(2, '0')}</span><span className="text-[10px] text-indigo-200 uppercase font-sans">Min</span></div>
        <span className="text-indigo-400">:</span>
        <div className="flex flex-col items-center"><span className="text-white w-[40px] text-center">{seconds.toString().padStart(2, '0')}</span><span className="text-[10px] text-indigo-200 uppercase font-sans">Sec</span></div>
      </div>
    );
  };

  // --- HANDLERS ---

  const handleGenerateReport = (reportName) => {
    setGeneratingReport(reportName);
    toast.info(`Initializing generation for ${reportName}...`);
    
    // Simulate API delay
    setTimeout(() => {
      setGeneratingReport(null);
      toast.success(`${reportName} generated successfully`);
      // In real app, trigger window.open(url)
    }, 2500);
  };

  const handleLoadMore = () => {
    setItemsToShow(prev => prev + 5);
  };

  // Filter Logic
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.id.toString().includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [logs, searchTerm, statusFilter]);

  // --- RENDER ---

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500 font-sans text-slate-800 dark:text-slate-200">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl text-white shadow-xl shadow-indigo-500/20">
              <FiShield size={24} />
            </div>
            System Operations Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Live audit trails, system health telemetry, and compliance reporting.
          </p>
        </div>
        
        <button 
          onClick={() => handleGenerateReport("Full_System_Audit.pdf")}
          disabled={!!generatingReport}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {generatingReport === "Full_System_Audit.pdf" ? <FiRefreshCw className="animate-spin"/> : <FiFileText/>}
          {generatingReport === "Full_System_Audit.pdf" ? "Generating..." : "Generate Master Report"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: SYSTEM HEALTH & DOWNLOADS */}
        <div className="space-y-6">
          
          {/* Live Telemetry Card */}
          <div className="bg-slate-900 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden border border-slate-700">
             <div className="absolute top-0 right-0 p-4 opacity-10"><FiServer size={120}/></div>
             
             {/* Header */}
             <div className="flex justify-between items-start relative z-10">
               <div>
                 <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-100"><FiClock/> System Uptime</h3>
                 <p className="text-slate-400 text-xs mt-1">Continuous operation since last patch.</p>
               </div>
               <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold animate-pulse">
                 System Nominal
               </span>
             </div>

             {/* Timer */}
             <div className="mt-6 mb-6 relative z-10">
               {formatUptime(uptime)}
             </div>

             {/* Chart */}
             <div className="relative z-10">
               <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                 <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> CPU Load</span>
                 <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Memory</span>
               </div>
               <TelemetryChart data={telemetry} />
             </div>
          </div>

          {/* Download Center */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-lg dark:text-white mb-4 flex items-center gap-2">
              <FiDownload className="text-indigo-600"/> Report Archive
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Q3 Inventory Summary', size: '2.4 MB', date: 'Oct 1, 2023' },
                { name: 'Security Access Log', size: '1.1 MB', date: 'Sep 28, 2023' },
                { name: 'User Activity Audit', size: '850 KB', date: 'Sep 15, 2023' },
                { name: 'System Error Dump', size: '4.2 MB', date: 'Sep 10, 2023' }
              ].map((r, i) => (
                <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer group transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                   <div className="flex items-center gap-4">
                     <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-indigo-600 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                       <FiFileText size={18}/>
                     </div>
                     <div>
                       <p className="text-sm font-bold text-slate-700 dark:text-white group-hover:text-indigo-600 transition-colors">{r.name}</p>
                       <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">{r.date} • {r.size}</p>
                     </div>
                   </div>
                   <button 
                     onClick={() => handleGenerateReport(r.name)}
                     disabled={!!generatingReport}
                     className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                   >
                     {generatingReport === r.name ? <FiRefreshCw className="animate-spin"/> : <FiDownload/>}
                   </button>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-dashed border-indigo-200 dark:border-indigo-800">
              View All Archived Reports
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: AUDIT LOGS */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col min-h-[600px]">
           
           {/* Log Header */}
           <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                  <FiActivity className="text-emerald-500"/> Audit Log Stream
                </h3>
                <p className="text-xs text-slate-500 mt-1">Real-time immutable record of system events.</p>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                 {/* Status Filter */}
                 <div className="relative">
                   <select 
                     value={statusFilter}
                     onChange={e => setStatusFilter(e.target.value)} 
                     className="appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                   >
                     <option value="All">All Status</option>
                     <option value="Success">Success</option>
                     <option value="Warning">Warning</option>
                     <option value="Failed">Failed</option>
                   </select>
                   <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                   <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                 </div>

                 {/* Search */}
                 <div className="relative flex-1 md:flex-none">
                   <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                   <input 
                     type="text" 
                     placeholder="Search logs..." 
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)} 
                     className="w-full md:w-64 pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                   />
                 </div>
              </div>
           </div>
           
           {/* Log Table */}
           <div className="flex-1 overflow-x-auto">
             <table className="w-full text-left text-sm border-collapse">
               <thead className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs border-b border-slate-100 dark:border-slate-700">
                 <tr>
                   <th className="px-6 py-4 tracking-wider">Event ID</th>
                   <th className="px-6 py-4 tracking-wider">Action</th>
                   <th className="px-6 py-4 tracking-wider">User</th>
                   <th className="px-6 py-4 tracking-wider">Status</th>
                   <th className="px-6 py-4 tracking-wider">Timestamp</th>
                   <th className="px-6 py-4 tracking-wider text-right">Details</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                 <AnimatePresence>
                   {filteredLogs.slice(0, itemsToShow).map((log) => (
                     <motion.tr 
                       key={log.id} 
                       initial={{ opacity: 0, x: -10 }} 
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0 }}
                       className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group cursor-default"
                     >
                       <td className="px-6 py-4 font-mono text-xs text-slate-400">#{log.id}</td>
                       <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{log.action}</td>
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                             {log.user.charAt(0)}
                           </div>
                           <span className="text-slate-600 dark:text-slate-300">{log.user}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                           log.status === 'Success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 
                           log.status === 'Failed' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800' : 
                           'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'
                         }`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${
                             log.status === 'Success' ? 'bg-emerald-500' : 
                             log.status === 'Failed' ? 'bg-red-500' : 'bg-amber-500'
                           }`}></div>
                           {log.status}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.time}</td>
                       <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => setSelectedLog(log)}
                           className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                           View History
                         </button>
                       </td>
                     </motion.tr>
                   ))}
                 </AnimatePresence>
                 
                 {filteredLogs.length === 0 && (
                   <tr>
                     <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                       <FiSearch className="mx-auto mb-2 text-slate-300" size={24}/>
                       No logs found matching your filters.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>

           {/* Load More Footer */}
           {filteredLogs.length > itemsToShow && (
             <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center">
               <button 
                 onClick={handleLoadMore}
                 className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all"
               >
                 Load More Events ({filteredLogs.length - itemsToShow} remaining)
               </button>
             </div>
           )}
        </div>
      </div>

      {/* Detail Modal */}
      <LogDetailModal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} log={selectedLog} />

    </div>
  );
};

export default Reports;