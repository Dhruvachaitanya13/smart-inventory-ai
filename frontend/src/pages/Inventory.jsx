/**
 * @file Inventory.jsx
 * @description Master Inventory Registry & Control Center.
 * Represents the core operational view for asset management.
 * * FEATURES:
 * - Live Stock Telemetry: Simulates real-time warehouse movements.
 * - Advanced Filter Drawer: Granular control over data visibility.
 * - Contextual Bulk Actions: Floating toolbar for batch operations.
 * - Optimistic UI Updates: Instant interface feedback.
 * - Integrated Mini-Dashboard: High-level metrics at a glance.
 * * @module pages/Inventory
 * @version 6.0.0
 * @author SmartInv Enterprise Team
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { InventoryService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import ProductModal from '../components/ProductModal';
import { toast } from 'react-toastify';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiDownload, FiUpload, FiPlus, FiTrash2, FiBox, 
  FiRefreshCw, FiMoreHorizontal, FiFilter, FiCheckSquare, 
  FiSquare, FiChevronLeft, FiChevronRight, FiEdit2, FiActivity,
  FiArchive, FiAlertCircle, FiX, FiCheck
} from 'react-icons/fi';

// --- CONFIGURATION ---
const ITEMS_PER_PAGE = 15;
const LIVE_UPDATE_INTERVAL = 5000; // 5 seconds

// Professional Table Schema
const COLUMNS = [
  { key: 'select', label: '', width: '50px', sortable: false },
  { key: 'name', label: 'Asset Identification', width: '250px', sortable: true },
  { key: 'category', label: 'Classification', width: '150px', sortable: true },
  { key: 'stock', label: 'Inventory Level', width: '180px', sortable: true },
  { key: 'value', label: 'Unit Valuation', width: '120px', sortable: true },
  { key: 'total', label: 'Total Equity', width: '120px', sortable: true },
  { key: 'status', label: 'Status', width: '140px', sortable: true },
  { key: 'actions', label: 'Actions', width: '100px', sortable: false },
];

// --- SUB-COMPONENTS ---

/**
 * @component InventoryStats
 * @description Top-level KPI cards specific to inventory health.
 */
const InventoryStats = ({ products }) => {
  const stats = useMemo(() => {
    const totalItems = products.length;
    const lowStock = products.filter(p => p.quantity < 10 && p.quantity > 0).length;
    const outStock = products.filter(p => p.quantity === 0).length;
    const totalValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    return { totalItems, lowStock, outStock, totalValue };
  }, [products]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg"><FiBox size={20} /></div>
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total SKUs</p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.totalItems}</p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg"><FiActivity size={20} /></div>
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Valuation</p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">${stats.totalValue.toLocaleString()}</p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg"><FiAlertCircle size={20} /></div>
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Low Stock</p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.lowStock}</p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg"><FiArchive size={20} /></div>
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Out of Stock</p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.outStock}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * @component FilterDrawer
 * @description Side panel for advanced filtering criteria.
 */
const FilterDrawer = ({ isOpen, onClose, filters, setFilters }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-slate-800 shadow-2xl z-50 border-l border-slate-200 dark:border-slate-700 flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><FiFilter /> Filters</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"><FiX size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Stock Status</label>
                <div className="space-y-2">
                  {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(status => (
                    <label key={status} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.status === status ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                        {filters.status === status && <FiCheck className="text-white" size={12}/>}
                      </div>
                      <input type="radio" className="hidden" checked={filters.status === status} onChange={() => setFilters({...filters, status})} />
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Source</label>
                <select 
                  value={filters.source} 
                  onChange={(e) => setFilters({...filters, source: e.target.value})}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Sources</option>
                  <option value="manual">Manual Entry</option>
                  <option value="import">CSV Import</option>
                  <option value="demo">Demo Data</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Price Range</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm" />
                  <span className="text-slate-400">-</span>
                  <input type="number" placeholder="Max" className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm" />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <button 
                onClick={() => setFilters({ status: 'All', source: 'All' })}
                className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- MAIN COMPONENT ---

const Inventory = () => {
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Advanced Filter State
  const [filters, setFilters] = useState({
    status: 'All',
    source: 'All',
    category: 'All'
  });

  const fileInputRef = useRef(null);

  // --- API CALLS ---
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search: searchTerm };
      if (filters.status !== 'All') params.status = filters.status === 'Low Stock' ? 'LOW_STOCK' : filters.status === 'Out of Stock' ? 'OUT_OF_STOCK' : 'IN_STOCK';
      if (filters.source !== 'All') params.source = filters.source;
      
      const res = await InventoryService.getAll(params);
      setProducts(res.data.data || []);
    } catch (err) {
      toast.error("Unable to sync registry.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  // Initial Load & Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => fetchInventory(), 400);
    return () => clearTimeout(timer);
  }, [fetchInventory]);

  // --- LIVE SIMULATION EFFECT ---
  // Subtly updates stock numbers every few seconds to simulate a live warehouse
  useEffect(() => {
    const interval = setInterval(() => {
      setProducts(prev => prev.map(p => {
        // Randomly update 10% of items
        if (Math.random() > 0.9 && p.quantity > 0) {
          const change = Math.random() > 0.5 ? -1 : 1;
          // Don't go below 0
          return { ...p, quantity: Math.max(0, p.quantity + change) };
        }
        return p;
      }));
    }, LIVE_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // --- HANDLERS ---

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0) setSelectedIds([]);
    else setSelectedIds(paginatedProducts.map(p => p._id));
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleDelete = async (id) => {
    // Optimistic Update
    const original = [...products];
    setProducts(products.filter(p => p._id !== id));
    
    try {
      await InventoryService.delete(id);
      toast.success("Asset decommissioned");
    } catch (e) {
      setProducts(original); // Revert
      toast.error("Deletion failed");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently remove ${selectedIds.length} assets?`)) return;
    
    // Optimistic Update
    const original = [...products];
    setProducts(products.filter(p => !selectedIds.includes(p._id)));
    setSelectedIds([]);

    try {
      await InventoryService.bulkDelete(selectedIds);
      toast.success(`${selectedIds.length} items removed`);
    } catch (e) {
      setProducts(original);
      toast.error("Bulk delete failed");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const toastId = toast.loading("Analyzing CSV Structure...");
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          await InventoryService.import(results.data);
          toast.update(toastId, { render: `Imported ${results.data.length} records`, type: "success", isLoading: false, autoClose: 3000 });
          fetchInventory();
        } catch (err) {
          toast.update(toastId, { render: "Import Failed", type: "error", isLoading: false, autoClose: 3000 });
        }
      }
    });
    e.target.value = null; 
  };

  const handleExport = () => {
    toast.info("Preparing Compliance Report...");
    const csvData = products.map(p => ({
      "Asset Name": p.name, "SKU": p.sku, "Category": p.category, 
      "Stock": p.quantity, "Unit Value": p.price, "Total Equity": (p.price * p.quantity).toFixed(2),
      "Source": p.source, "Created At": new Date(p.createdAt).toLocaleDateString()
    }));
    const csv = Papa.unparse(csvData);
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `Inventory_Registry_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // --- PAGINATION LOGIC ---
  const filteredProducts = products; // Filtering handled by API, but local sort could go here
  const pageCount = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500 font-sans text-slate-800 dark:text-slate-200">
      
      {/* 1. HEADER AREA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg text-white shadow-lg">
              <FiBox size={24} />
            </div>
            Inventory Registry
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            Centralized asset database and real-time stock control.
          </p>
        </div>
        
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv"/>
          <button onClick={() => fileInputRef.current.click()} className="btn-secondary px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-all">
             <FiUpload/> Import
          </button>
          <button onClick={handleExport} className="btn-secondary px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-all">
             <FiDownload/> Export
          </button>
          <button onClick={handleCreate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/50 transition-all active:scale-95">
             <FiPlus size={18} /> New Asset
          </button>
        </div>
      </div>

      {/* 2. STATS BAR */}
      <InventoryStats products={products} />

      {/* 3. TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
          <input 
            type="text" 
            placeholder="Search by SKU, Name, or Category..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm font-medium"
          />
        </div>
        <button 
          onClick={() => setShowFilterDrawer(true)}
          className={`px-5 py-3.5 rounded-xl border font-bold text-sm flex items-center gap-2 transition-all ${
            filters.status !== 'All' || filters.source !== 'All'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <FiFilter size={18} /> Filters
          {(filters.status !== 'All' || filters.source !== 'All') && (
            <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
          )}
        </button>
      </div>

      {/* 4. MAIN TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative min-h-[400px]">
        {loading && products.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-800/80 z-10 backdrop-blur-sm">
             <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-slate-500 font-bold animate-pulse">Syncing Registry...</p>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {COLUMNS.map(col => (
                  <th key={col.key} style={{ width: col.width }} className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    {col.key === 'select' ? (
                      <button onClick={handleSelectAll} className="text-slate-400 hover:text-indigo-600 transition-colors">
                        {selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0 
                          ? <FiCheckSquare size={18} className="text-indigo-600"/> 
                          : <FiSquare size={18}/>
                        }
                      </button>
                    ) : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              <AnimatePresence>
                {paginatedProducts.map(p => (
                  <motion.tr 
                    key={p._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={`group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${selectedIds.includes(p._id) ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <button onClick={() => handleSelectOne(p._id)} className={`text-slate-400 hover:text-indigo-600 transition-colors ${selectedIds.includes(p._id) ? 'text-indigo-600' : ''}`}>
                        {selectedIds.includes(p._id) ? <FiCheckSquare size={18}/> : <FiSquare size={18}/>}
                      </button>
                    </td>
                    
                    {/* Name & SKU */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-xs">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">{p.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.sku}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {p.category}
                      </span>
                    </td>

                    {/* Stock Level (With Progress Bar) */}
                    <td className="px-6 py-4">
                      <div className="w-full max-w-[120px]">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{p.quantity}</span>
                          <span className="text-slate-400 text-[10px]">Unit</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${Math.min(p.quantity, 100)}%` }}
                            className={`h-full rounded-full ${p.quantity < 10 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                          />
                        </div>
                      </div>
                    </td>

                    {/* Unit Value */}
                    <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-slate-400">
                      ${p.price.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>

                    {/* Total Value */}
                    <td className="px-6 py-4 font-mono text-sm font-bold text-slate-800 dark:text-white">
                      ${(p.price * p.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {p.quantity === 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-900/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Out of Stock
                        </span>
                      ) : p.quantity < 10 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> In Stock
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-all" title="Edit Asset">
                          <FiEdit2 size={16}/>
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-all" title="Archive Asset">
                          <FiTrash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-700 dark:text-slate-300">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(currentPage * ITEMS_PER_PAGE, products.length)}</span> of {products.length} records
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <FiChevronLeft size={14}/> Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pageCount) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${currentPage === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
              disabled={currentPage === pageCount}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              Next <FiChevronRight size={14}/>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 z-50 border border-slate-700"
          >
            <div className="font-bold text-sm flex items-center gap-2">
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-md">{selectedIds.length}</span>
              Items Selected
            </div>
            <div className="h-6 w-px bg-slate-700"></div>
            <div className="flex gap-2">
              <button className="px-4 py-2 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">Archive</button>
              <button className="px-4 py-2 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">Export</button>
              <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold shadow-lg shadow-red-900/20 transition-all">
                Delete Selection
              </button>
            </div>
            <button onClick={() => setSelectedIds([])} className="ml-2 p-1 hover:bg-slate-800 rounded-full text-slate-400">
              <FiX size={18}/>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub Components */}
      <FilterDrawer 
        isOpen={showFilterDrawer} 
        onClose={() => setShowFilterDrawer(false)} 
        filters={filters}
        setFilters={setFilters}
      />
      
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchInventory} 
        initialData={editingProduct} // Pass data for editing mode
      />

    </div>
  );
};

export default Inventory;