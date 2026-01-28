/**
 * @file ProductModal.jsx
 * @description Advanced Product Creation/Edition Modal.
 * Supports the full Enterprise Schema via a multi-tab interface.
 * * FEATURES:
 * - Multi-Tab Layout: General, Financials, Inventory, Supplier
 * - Dynamic Tag Management (Add/Remove)
 * - Live Validation per Tab
 * - Responsive Overlay
 * @module components/ProductModal
 */

import React, { useState, useEffect } from 'react';
import { InventoryService } from '../services/api';
import { toast } from 'react-toastify';
import { 
  FiX, FiSave, FiPackage, FiDollarSign, FiTruck, 
  FiTag, FiAlignLeft, FiInfo, FiLayers 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONSTANTS ---
const TABS = [
  { id: 'general', label: 'General Info', icon: FiInfo },
  { id: 'financials', label: 'Financials', icon: FiDollarSign },
  { id: 'inventory', label: 'Inventory', icon: FiLayers },
  { id: 'supplier', label: 'Supplier', icon: FiTruck },
];

const CATEGORIES = [
  'Electronics', 'Laptops', 'Audio', 'Accessories', 'Monitors', 
  'Tablets', 'Furniture', 'Networking', 'Hardware', 'Servers', 'Other'
];

const ProductModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  // Comprehensive Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Electronics',
    description: '',
    price: '',
    cost: '',
    quantity: '',
    minStockLevel: 10,
    maxStockLevel: 1000,
    tags: [],
    supplier: {
      name: '',
      contact: '',
      leadTime: 7
    }
  });

  // Reset or Load Data
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          supplier: initialData.supplier || { name: '', contact: '', leadTime: 7 }
        });
      } else {
        // Reset to default
        setFormData({
          name: '', category: 'Electronics', description: '',
          price: '', cost: '', quantity: '',
          minStockLevel: 10, maxStockLevel: 1000,
          tags: [],
          supplier: { name: '', contact: '', leadTime: 7 }
        });
      }
      setActiveTab('general');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // --- HANDLERS ---

  const handleChange = (e, section = null) => {
    const { name, value } = e.target;
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [name]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTagAdd = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic Validation
      if (!formData.name || !formData.price || !formData.quantity) {
        throw new Error("Please fill in all required fields (Name, Price, Quantity)");
      }

      if (initialData) {
        await InventoryService.update(initialData._id, formData);
        toast.success("Product Updated Successfully");
      } else {
        await InventoryService.create(formData);
        toast.success("Product Created Successfully");
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERERS ---

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid gap-6">
              <div>
                <label className="label">Product Name *</label>
                <div className="input-group">
                  <FiPackage className="icon" />
                  <input required name="name" value={formData.name} onChange={handleChange} className="input" placeholder="e.g. MacBook Pro M3" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="input">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Tags (Press Enter)</label>
                  <div className="input-group">
                    <FiTag className="icon" />
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagAdd} className="input" placeholder="Add tag..." />
                  </div>
                </div>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg flex items-center gap-1">
                      {tag} <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><FiX/></button>
                    </span>
                  ))}
                </div>
              )}

              <div>
                <label className="label">Description</label>
                <div className="relative">
                  <FiAlignLeft className="absolute top-3 left-3 text-slate-400" />
                  <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="input pl-10 pt-2" placeholder="Detailed product specifications..." />
                </div>
              </div>
            </div>
          </div>
        );

      case 'financials':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="label">Selling Price ($) *</label>
                <div className="input-group">
                  <FiDollarSign className="icon" />
                  <input required type="number" name="price" value={formData.price} onChange={handleChange} className="input" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="label">Cost of Goods ($)</label>
                <div className="input-group">
                  <FiDollarSign className="icon" />
                  <input type="number" name="cost" value={formData.cost} onChange={handleChange} className="input" placeholder="0.00" />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-700">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Profit Analysis (Simulated)</h4>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Margin:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formData.price && formData.cost ? 
                    ((formData.price - formData.cost) / formData.price * 100).toFixed(1) + '%' 
                    : '--'}
                </span>
              </div>
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="label">Current Quantity *</label>
              <input required type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="input" placeholder="0" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="label">Min Stock Level (Alert)</label>
                <input type="number" name="minStockLevel" value={formData.minStockLevel} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">Max Stock Level</label>
                <input type="number" name="maxStockLevel" value={formData.maxStockLevel} onChange={handleChange} className="input" />
              </div>
            </div>
          </div>
        );

      case 'supplier':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="label">Supplier Name</label>
              <div className="input-group">
                <FiTruck className="icon" />
                <input name="name" value={formData.supplier.name} onChange={(e) => handleChange(e, 'supplier')} className="input" placeholder="Company Name" />
              </div>
            </div>
            <div>
              <label className="label">Contact Info</label>
              <input name="contact" value={formData.supplier.contact} onChange={(e) => handleChange(e, 'supplier')} className="input" placeholder="Email or Phone" />
            </div>
            <div>
              <label className="label">Lead Time (Days)</label>
              <input type="number" name="leadTime" value={formData.supplier.leadTime} onChange={(e) => handleChange(e, 'supplier')} className="input" />
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {initialData ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-slate-500">Fill in the details below to sync with the warehouse.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
            <FiX size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 flex gap-4 border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="product-form" onSubmit={handleSubmit}>
            {renderTabContent()}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 sticky bottom-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 rounded-lg transition-colors">
            Cancel
          </button>
          <button 
            type="submit" 
            form="product-form" 
            disabled={loading}
            className="px-6 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-70 transition-all"
          >
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <FiSave />}
            Save Product
          </button>
        </div>

      </motion.div>

      {/* Global Style overrides for this component */}
      <style jsx>{`
        .label {
          @apply block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1;
        }
        .input {
          @apply w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium;
        }
        .input-group {
          @apply relative;
        }
        .input-group .icon {
          @apply absolute left-3 top-1/2 -translate-y-1/2 text-slate-400;
        }
        .input-group .input {
          @apply pl-10;
        }
      `}</style>
    </div>
  );
};

export default ProductModal;