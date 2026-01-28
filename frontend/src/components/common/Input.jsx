import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Input = forwardRef(({ 
  label, 
  error, 
  icon: Icon, 
  className = '', 
  id,
  ...props 
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
        )}
        
        <input
          ref={ref}
          id={id}
          className={`
            block w-full rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400
            focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent transition-all
            disabled:opacity-60 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : 'pl-4'}
            ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50' : ''}
            py-2.5 sm:text-sm shadow-sm
          `}
          {...props}
        />
      </div>

      {/* Error Message Animation */}
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center animate-fade-in">
          <span className="mr-1">⚠</span> {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  icon: PropTypes.elementType,
  id: PropTypes.string,
};

export default Input;