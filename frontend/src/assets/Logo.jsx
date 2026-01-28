import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable Logo Component
 * Renders the brand logo as an SVG with customizable size and color classes.
 * * @param {string} className - Tailwind CSS classes for container sizing/positioning
 * @param {string} color - Text/Fill color class (e.g., 'text-indigo-600')
 */
export const Logo = ({ className = "w-10 h-10", color = "text-indigo-600" }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`w-full h-full ${color}`}
      aria-label="Smart Inventory AI Logo"
    >
      <path 
        d="M12 2L2 7L12 12L22 7L12 2Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M2 17L12 22L22 17" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M2 12L12 17L22 12" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* AI Sparkle Element */}
      <circle cx="18" cy="5" r="2" className="fill-purple-500 animate-pulse" />
    </svg>
  </div>
);

Logo.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string,
};