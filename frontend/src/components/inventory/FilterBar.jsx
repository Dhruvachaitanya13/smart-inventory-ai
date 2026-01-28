import React from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiFilter, FiDownload, FiRefreshCw, FiGrid, FiList } from 'react-icons/fi';

/**
 * FilterBar Component
 * Provides controls for searching, filtering, and exporting inventory data.
 */
const FilterBar = ({ 
  searchTerm, 
  onSearchChange, 
  onRefresh, 
  viewMode, 
  setViewMode,
  activeFiltersCount = 0 
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center transition-all duration-300">
      
      {/* 1. Search Input Section */}
      <div className="relative w-full md:w-96 group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by SKU, Name, or Category..."
          className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent sm:text-sm transition-all shadow-sm"
          aria-label="Search Inventory"
        />
      </div>

      {/* 2. Action Buttons */}
      <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
        
        {/* View Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="List View"
          >
            <FiList />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="Grid View"
          >
            <FiGrid />
          </button>
        </div>

        {/* Filter Button */}
        <button 
          className="flex items-center justify-center px-4 py-2.5 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 transition-colors relative"
          aria-label="Open Filters"
        >
          <FiFilter className="mr-2 h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
        
        {/* Refresh Button */}
        <button 
          onClick={onRefresh}
          className="flex items-center justify-center p-2.5 border border-slate-200 shadow-sm rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          title="Refresh Data"
        >
          <FiRefreshCw className="h-4 w-4" />
        </button>

        {/* Export Button */}
        <button 
          className="flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform active:scale-95"
        >
          <FiDownload className="mr-2 h-4 w-4" />
          Export CSV
        </button>
      </div>
    </div>
  );
};

FilterBar.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
  viewMode: PropTypes.oneOf(['list', 'grid']),
  setViewMode: PropTypes.func,
  activeFiltersCount: PropTypes.number
};

export default FilterBar;